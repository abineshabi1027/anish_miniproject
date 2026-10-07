const pool = require('../config/db');
const {
  getServiceQueueState,
  generateNextToken,
  createNotification,
  updateNearTurnTokens
} = require('../services/queueService');
const { emitQueueUpdate, emitStaffUpdate } = require('../sockets/queueSocket');

/**
 * Customer joins a virtual queue
 */
const joinQueue = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { serviceId, notes } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'serviceId is required.' });
    }

    // 1. Verify service and organization status
    const [serviceRows] = await connection.query(
      `SELECT s.*, o.name as org_name, o.status as org_status 
       FROM services s 
       JOIN organizations o ON s.organization_id = o.id 
       WHERE s.id = ?`,
      [serviceId]
    );

    if (serviceRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const service = serviceRows[0];

    if (service.status !== 'ACTIVE') {
      connection.release();
      return res.status(400).json({ success: false, message: 'This service is currently inactive or paused.' });
    }

    if (service.org_status !== 'OPEN' && service.org_status !== 'ACTIVE') {
      connection.release();
      return res.status(400).json({ success: false, message: `${service.org_name} is currently closed.` });
    }

    // 2. Check if customer already has an active token in THIS service today
    const [existingToken] = await connection.query(
      `SELECT * FROM queue_tokens 
       WHERE user_id = ? AND service_id = ? AND token_date = CURDATE() 
         AND status IN ('WAITING', 'NEAR_TURN', 'SERVING', 'ON_HOLD')`,
      [userId, serviceId]
    );

    if (existingToken.length > 0) {
      connection.release();
      return res.status(409).json({
        success: false,
        message: `You already hold active Token ${existingToken[0].token_number} for this service!`,
        token: existingToken[0]
      });
    }

    // 3. Verify maximum capacity
    const [waitingCountRows] = await connection.query(
      `SELECT COUNT(*) as count FROM queue_tokens 
       WHERE service_id = ? AND token_date = CURDATE() AND status IN ('WAITING', 'NEAR_TURN')`,
      [serviceId]
    );

    const currentWaiting = waitingCountRows[0].count;
    if (currentWaiting >= service.max_capacity) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Queue limit reached for ${service.name}. Maximum capacity is ${service.max_capacity}.`
      });
    }

    // 4. Begin transaction for safe token generation
    await connection.beginTransaction();

    const { sequenceNum, tokenNumber } = await generateNextToken(serviceId, connection);

    // Initial status: if only 0-2 people ahead, consider NEAR_TURN, else WAITING
    const initialStatus = currentWaiting <= 2 ? 'NEAR_TURN' : 'WAITING';

    const [insertResult] = await connection.query(
      `INSERT INTO queue_tokens 
       (token_number, sequence_num, token_date, user_id, organization_id, service_id, status, notes)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
      [tokenNumber, sequenceNum, userId, service.organization_id, serviceId, initialStatus, notes || null]
    );

    const tokenId = insertResult.insertId;
    await connection.commit();
    connection.release();

    // 5. Notify customer
    await createNotification(
      userId,
      `You joined ${service.name} at ${service.org_name}. Your token is ${tokenNumber}.`,
      'QUEUE_JOINED'
    );

    // 6. Calculate state and broadcast update to all connected clients
    const queueState = await getServiceQueueState(serviceId);
    emitQueueUpdate(serviceId, queueState);

    // 7. Calculate people ahead for the newly joined customer
    const peopleAhead = currentWaiting;
    const estimatedWait = peopleAhead * (service.average_service_time || 15);

    res.status(201).json({
      success: true,
      message: 'Queue joined successfully!',
      token: {
        id: tokenId,
        token_number: tokenNumber,
        sequence_num: sequenceNum,
        organization_name: service.org_name,
        service_name: service.name,
        status: initialStatus,
        people_ahead: peopleAhead,
        estimated_wait_minutes: estimatedWait,
        current_serving_token: queueState.currentServing ? queueState.currentServing.token_number : 'None'
      }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Join queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to join queue', error: error.message });
  }
};

/**
 * Get single token live details with people ahead and estimated wait
 */
const getTokenDetails = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const [tokenRows] = await pool.query(
      `SELECT qt.*, 
        s.name as service_name, s.average_service_time,
        o.name as organization_name, o.location as organization_location,
        u.name as user_name,
        c.counter_name
       FROM queue_tokens qt
       JOIN services s ON qt.service_id = s.id
       JOIN organizations o ON qt.organization_id = o.id
       JOIN users u ON qt.user_id = u.id
       LEFT JOIN counters c ON qt.counter_id = c.id
       WHERE qt.id = ?`,
      [tokenId]
    );

    if (tokenRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const token = tokenRows[0];

    // Compute people ahead if still waiting
    let peopleAhead = 0;
    if (['WAITING', 'NEAR_TURN'].includes(token.status)) {
      const [aheadRows] = await pool.query(
        `SELECT COUNT(*) as count FROM queue_tokens
         WHERE service_id = ? AND token_date = ? 
           AND status IN ('WAITING', 'NEAR_TURN')
           AND sequence_num < ?`,
        [token.service_id, token.token_date, token.sequence_num]
      );
      peopleAhead = aheadRows[0].count;
    }

    // Get current serving token
    const [servingRows] = await pool.query(
      `SELECT token_number FROM queue_tokens 
       WHERE service_id = ? AND token_date = ? AND status = 'SERVING'
       ORDER BY called_at DESC LIMIT 1`,
      [token.service_id, token.token_date]
    );

    const currentServing = servingRows.length > 0 ? servingRows[0].token_number : 'None';
    const estimatedWait = peopleAhead * (token.average_service_time || 15);

    res.json({
      success: true,
      token: {
        ...token,
        people_ahead: peopleAhead,
        current_serving_token: currentServing,
        estimated_wait_minutes: estimatedWait
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Customer leaves/cancels their queue position
 */
const leaveQueue = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const userId = req.user.id;

    const [tokenRows] = await pool.query(
      `SELECT qt.*, s.name as service_name, o.name as org_name
       FROM queue_tokens qt
       JOIN services s ON qt.service_id = s.id
       JOIN organizations o ON qt.organization_id = o.id
       WHERE qt.id = ?`,
      [tokenId]
    );

    if (tokenRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const token = tokenRows[0];

    // Check ownership or admin
    if (token.user_id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this token.' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(token.status)) {
      return res.status(400).json({ success: false, message: `Token is already ${token.status.toLowerCase()}.` });
    }

    // Mark as CANCELLED
    await pool.query(
      `UPDATE queue_tokens SET status = 'CANCELLED', completed_at = NOW() WHERE id = ?`,
      [tokenId]
    );

    // Save to history
    await pool.query(
      `INSERT INTO queue_history 
       (token_id, token_number, user_id, organization_id, service_id, counter_id, status, joined_at, completed_at, waiting_minutes)
       VALUES (?, ?, ?, ?, ?, ?, 'CANCELLED', ?, NOW(), TIMESTAMPDIFF(MINUTE, ?, NOW()))`,
      [token.id, token.token_number, token.user_id, token.organization_id, token.service_id, token.counter_id, token.joined_at, token.joined_at]
    );

    // Notify user
    await createNotification(
      token.user_id,
      `You left the queue for ${token.service_name} (Token ${token.token_number}).`,
      'QUEUE_CANCELLED'
    );

    // Recalculate queue & broadcast
    await updateNearTurnTokens(token.service_id);
    const updatedState = await getServiceQueueState(token.service_id);
    emitQueueUpdate(token.service_id, updatedState);

    res.json({
      success: true,
      message: `You have successfully left the queue for Token ${token.token_number}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to leave queue', error: error.message });
  }
};

/**
 * Get current live queue for a service
 */
const getServiceQueue = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const queueState = await getServiceQueueState(serviceId);

    if (!queueState) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    res.json({
      success: true,
      ...queueState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user's active token and today's tickets
 */
const getUserActiveTokens = async (req, res) => {
  try {
    const userId = req.user.id;

    const [tokens] = await pool.query(
      `SELECT qt.*, 
        s.name as service_name, s.average_service_time,
        o.name as organization_name, o.location as organization_location, o.category as organization_category,
        c.counter_name
       FROM queue_tokens qt
       JOIN services s ON qt.service_id = s.id
       JOIN organizations o ON qt.organization_id = o.id
       LEFT JOIN counters c ON qt.counter_id = c.id
       WHERE qt.user_id = ? AND qt.token_date = CURDATE()
         AND qt.status IN ('WAITING', 'NEAR_TURN', 'SERVING', 'ON_HOLD')
       ORDER BY qt.joined_at DESC`,
      [userId]
    );

    // Enrich each token with people ahead and current serving token
    const enriched = await Promise.all(tokens.map(async (tok) => {
      let peopleAhead = 0;
      if (['WAITING', 'NEAR_TURN'].includes(tok.status)) {
        const [aheadRows] = await pool.query(
          `SELECT COUNT(*) as count FROM queue_tokens
           WHERE service_id = ? AND token_date = ? 
             AND status IN ('WAITING', 'NEAR_TURN')
             AND sequence_num < ?`,
          [tok.service_id, tok.token_date, tok.sequence_num]
        );
        peopleAhead = aheadRows[0].count;
      }

      const [servingRows] = await pool.query(
        `SELECT token_number, c.counter_name FROM queue_tokens qt
         LEFT JOIN counters c ON qt.counter_id = c.id
         WHERE qt.service_id = ? AND qt.token_date = ? AND qt.status = 'SERVING'
         ORDER BY qt.called_at DESC LIMIT 1`,
        [tok.service_id, tok.token_date]
      );

      return {
        ...tok,
        people_ahead: peopleAhead,
        estimated_wait_minutes: peopleAhead * (tok.average_service_time || 15),
        current_serving_token: servingRows.length > 0 ? servingRows[0].token_number : 'None',
        current_serving_counter: servingRows.length > 0 ? servingRows[0].counter_name : null
      };
    }));

    // Summary stats for customer
    const [historyCount] = await pool.query(
      `SELECT COUNT(*) as total_completed FROM queue_history WHERE user_id = ? AND status = 'COMPLETED'`,
      [userId]
    );

    res.json({
      success: true,
      activeTokens: enriched,
      activeToken: enriched.length > 0 ? enriched[0] : null,
      completedVisits: historyCount[0].total_completed
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get customer queue history
 */
const getUserQueueHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [history] = await pool.query(
      `SELECT qh.*, 
        s.name as service_name, 
        o.name as organization_name, o.category as organization_category, o.location as organization_location,
        c.counter_name
       FROM queue_history qh
       JOIN services s ON qh.service_id = s.id
       JOIN organizations o ON qh.organization_id = o.id
       LEFT JOIN counters c ON qh.counter_id = c.id
       WHERE qh.user_id = ?
       ORDER BY qh.completed_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  joinQueue,
  getTokenDetails,
  leaveQueue,
  getServiceQueue,
  getUserActiveTokens,
  getUserQueueHistory
};
