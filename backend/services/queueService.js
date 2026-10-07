const pool = require('../config/db');
const { emitQueueUpdate, emitUserNotification } = require('../sockets/queueSocket');

/**
 * Calculate live queue statistics for a given service
 * - Currently serving token
 * - Total waiting customers
 * - Next token in line
 * - Estimated wait time
 */
const getServiceQueueState = async (serviceId) => {
  // 1. Get service details
  const [serviceRows] = await pool.query(
    'SELECT s.*, o.name as org_name FROM services s JOIN organizations o ON s.organization_id = o.id WHERE s.id = ?',
    [serviceId]
  );
  if (!serviceRows.length) return null;
  const service = serviceRows[0];

  // 2. Currently serving token for today
  const [servingRows] = await pool.query(
    `SELECT qt.*, u.name as user_name, c.counter_name 
     FROM queue_tokens qt 
     JOIN users u ON qt.user_id = u.id 
     LEFT JOIN counters c ON qt.counter_id = c.id
     WHERE qt.service_id = ? AND qt.token_date = CURDATE() AND qt.status = 'SERVING'
     ORDER BY qt.called_at DESC LIMIT 1`,
    [serviceId]
  );
  const currentServing = servingRows.length > 0 ? servingRows[0] : null;

  // 3. Waiting tokens queue (ordered by sequence_num ASC)
  const [waitingRows] = await pool.query(
    `SELECT qt.*, u.name as user_name, u.phone as user_phone
     FROM queue_tokens qt
     JOIN users u ON qt.user_id = u.id
     WHERE qt.service_id = ? AND qt.token_date = CURDATE() 
       AND qt.status IN ('WAITING', 'NEAR_TURN', 'ON_HOLD')
     ORDER BY 
       CASE WHEN qt.status = 'ON_HOLD' THEN 2 ELSE 1 END,
       qt.sequence_num ASC`,
    [serviceId]
  );

  const activeWaitingList = waitingRows.filter(t => t.status !== 'ON_HOLD');
  const onHoldList = waitingRows.filter(t => t.status === 'ON_HOLD');
  const waitingCount = activeWaitingList.length;

  const nextToken = activeWaitingList.length > 0 ? activeWaitingList[0] : null;
  const estimatedWaitMinutes = waitingCount * (service.average_service_time || 15);

  // 4. Completed count today
  const [completedRows] = await pool.query(
    `SELECT COUNT(*) as count FROM queue_tokens 
     WHERE service_id = ? AND token_date = CURDATE() AND status = 'COMPLETED'`,
    [serviceId]
  );
  const completedToday = completedRows[0].count;

  return {
    service,
    currentServing,
    waitingList: waitingRows,
    waitingCount,
    onHoldList,
    nextToken,
    estimatedWaitMinutes,
    completedToday
  };
};

/**
 * Generate the next token number for a service on today's date
 * Resets daily and guarantees consecutive sequence
 */
const generateNextToken = async (serviceId, connection = null) => {
  const db = connection || pool;
  // Get service prefix
  const [services] = await db.query('SELECT token_prefix FROM services WHERE id = ?', [serviceId]);
  const prefix = (services.length > 0 && services[0].token_prefix) ? services[0].token_prefix.toUpperCase() : 'Q';

  // Get max sequence today with write lock if transaction is active
  const [maxSeqRows] = await db.query(
    'SELECT COALESCE(MAX(sequence_num), 0) as max_seq FROM queue_tokens WHERE service_id = ? AND token_date = CURDATE()',
    [serviceId]
  );

  const nextSeq = (maxSeqRows[0].max_seq || 0) + 1;
  const formattedNumber = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

  return {
    sequenceNum: nextSeq,
    tokenNumber: formattedNumber
  };
};

/**
 * Send and store an in-app notification + push via socket
 */
const createNotification = async (userId, message, type = 'INFO') => {
  try {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, ?, FALSE)',
      [userId, message, type]
    );

    const notification = {
      id: result.insertId,
      user_id: userId,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };

    emitUserNotification(userId, notification);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Re-evaluate NEAR_TURN status for waiting tokens in a service
 * If token is within 1-2 people ahead, update to NEAR_TURN and notify
 */
const updateNearTurnTokens = async (serviceId) => {
  try {
    const [waitingTokens] = await pool.query(
      `SELECT qt.id, qt.user_id, qt.token_number, qt.sequence_num, qt.status
       FROM queue_tokens qt
       WHERE qt.service_id = ? AND qt.token_date = CURDATE() AND qt.status IN ('WAITING', 'NEAR_TURN')
       ORDER BY qt.sequence_num ASC`,
      [serviceId]
    );

    for (let index = 0; index < waitingTokens.length; index++) {
      const token = waitingTokens[index];
      // Index 0 means next person to be called (0 people ahead of them)
      // Index 1 means 1 person ahead
      // Index 2 means 2 people ahead
      if (index <= 2 && token.status === 'WAITING') {
        await pool.query('UPDATE queue_tokens SET status = ? WHERE id = ?', ['NEAR_TURN', token.id]);
        await createNotification(
          token.user_id,
          `Your turn is approaching! Token ${token.token_number} has only ${index} person(s) ahead in line.`,
          'TOKEN_APPROACHING'
        );
      }
    }
  } catch (err) {
    console.error('Error updating near turn tokens:', err);
  }
};

module.exports = {
  getServiceQueueState,
  generateNextToken,
  createNotification,
  updateNearTurnTokens
};
