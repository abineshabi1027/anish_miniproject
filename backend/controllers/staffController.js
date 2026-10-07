const pool = require('../config/db');
const {
  getServiceQueueState,
  createNotification,
  updateNearTurnTokens
} = require('../services/queueService');
const { emitQueueUpdate, emitStaffUpdate } = require('../sockets/queueSocket');

/**
 * Get staff counter assignment & active queues
 */
const getStaffAssignment = async (req, res) => {
  try {
    const staffId = req.user.id;

    // Find assigned counters
    const [counters] = await pool.query(
      `SELECT c.*, s.name as service_name, s.token_prefix, s.average_service_time,
              o.id as organization_id, o.name as organization_name
       FROM counters c
       JOIN services s ON c.service_id = s.id
       JOIN organizations o ON c.organization_id = o.id
       WHERE c.staff_id = ?`,
      [staffId]
    );

    // If no counter explicitly assigned, provide all services as an option or default to first
    let assignedServiceId = null;
    let assignedCounter = null;

    if (counters.length > 0) {
      assignedCounter = counters[0];
      assignedServiceId = counters[0].service_id;
    } else {
      // Fallback: Default to service 1
      const [allServices] = await pool.query(
        `SELECT s.*, o.name as organization_name 
         FROM services s JOIN organizations o ON s.organization_id = o.id 
         LIMIT 1`
      );
      if (allServices.length > 0) {
        assignedServiceId = allServices[0].id;
      }
    }

    // Return all services so staff can also pick or switch counters
    const [allServicesList] = await pool.query(
      `SELECT s.id, s.name, s.token_prefix, o.name as organization_name, o.id as organization_id
       FROM services s
       JOIN organizations o ON s.organization_id = o.id
       WHERE s.status = 'ACTIVE'
       ORDER BY o.name ASC, s.name ASC`
    );

    res.json({
      success: true,
      assignedCounter,
      assignedServiceId,
      counters,
      allServices: allServicesList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * CALL NEXT customer in line
 */
const callNext = async (req, res) => {
  try {
    const { serviceId, counterId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'serviceId is required.' });
    }

    // 1. If there's an ongoing SERVING token on this counter/service, staff should complete or skip first, or auto-complete
    // Let's check if there is an active SERVING token
    const [currentServing] = await pool.query(
      `SELECT id, token_number, user_id FROM queue_tokens 
       WHERE service_id = ? AND token_date = CURDATE() AND status = 'SERVING'`,
      [serviceId]
    );

    // 2. Find next waiting token
    const [nextCandidates] = await pool.query(
      `SELECT qt.*, u.name as user_name, s.name as service_name, o.name as org_name
       FROM queue_tokens qt
       JOIN users u ON qt.user_id = u.id
       JOIN services s ON qt.service_id = s.id
       JOIN organizations o ON qt.organization_id = o.id
       WHERE qt.service_id = ? AND qt.token_date = CURDATE() 
         AND qt.status IN ('WAITING', 'NEAR_TURN')
       ORDER BY qt.sequence_num ASC
       LIMIT 1`,
      [serviceId]
    );

    if (nextCandidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No waiting customers in queue for this service.'
      });
    }

    const nextCustomer = nextCandidates[0];

    // If there was an old serving token without explicit complete, automatically mark it COMPLETED to avoid stall
    if (currentServing.length > 0) {
      for (const oldTok of currentServing) {
        await pool.query(
          `UPDATE queue_tokens SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?`,
          [oldTok.id]
        );
        // Add to history
        await pool.query(
          `INSERT INTO queue_history 
           (token_id, token_number, user_id, organization_id, service_id, counter_id, status, joined_at, called_at, completed_at, waiting_minutes)
           SELECT id, token_number, user_id, organization_id, service_id, counter_id, 'COMPLETED', joined_at, called_at, NOW(),
                  TIMESTAMPDIFF(MINUTE, joined_at, NOW())
           FROM queue_tokens WHERE id = ?`,
          [oldTok.id]
        );
      }
    }

    // 3. Mark candidate as SERVING
    await pool.query(
      `UPDATE queue_tokens 
       SET status = 'SERVING', called_at = NOW(), counter_id = ?
       WHERE id = ?`,
      [counterId || null, nextCustomer.id]
    );

    // 4. Notify customer via in-app & socket
    const counterLabel = counterId ? ` at counter` : '';
    await createNotification(
      nextCustomer.user_id,
      `YOUR TURN! Token ${nextCustomer.token_number} is now being served for ${nextCustomer.service_name}${counterLabel}. Please proceed immediately!`,
      'TOKEN_CALLED'
    );

    // 5. Update near turn tags for subsequent customers
    await updateNearTurnTokens(serviceId);

    // 6. Broadcast updated queue state
    const updatedState = await getServiceQueueState(serviceId);
    emitQueueUpdate(serviceId, updatedState);
    emitStaffUpdate(serviceId, updatedState);

    res.json({
      success: true,
      message: `Called Token ${nextCustomer.token_number}.`,
      calledToken: {
        ...nextCustomer,
        status: 'SERVING'
      },
      queueState: updatedState
    });
  } catch (error) {
    console.error('Call Next Error:', error);
    res.status(500).json({ success: false, message: 'Failed to call next token', error: error.message });
  }
};

/**
 * COMPLETE serving current customer
 */
const completeToken = async (req, res) => {
  try {
    const { tokenId, serviceId } = req.body;

    let targetTokenId = tokenId;
    if (!targetTokenId && serviceId) {
      // Find currently serving token
      const [serving] = await pool.query(
        `SELECT id FROM queue_tokens 
         WHERE service_id = ? AND token_date = CURDATE() AND status = 'SERVING'
         ORDER BY called_at DESC LIMIT 1`,
        [serviceId]
      );
      if (serving.length > 0) targetTokenId = serving[0].id;
    }

    if (!targetTokenId) {
      return res.status(400).json({ success: false, message: 'No active serving token to complete.' });
    }

    const [tokenRows] = await pool.query(
      `SELECT qt.*, s.name as service_name 
       FROM queue_tokens qt 
       JOIN services s ON qt.service_id = s.id 
       WHERE qt.id = ?`,
      [targetTokenId]
    );

    if (tokenRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const token = tokenRows[0];

    // Mark as completed
    await pool.query(
      `UPDATE queue_tokens SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?`,
      [targetTokenId]
    );

    // Insert into history
    await pool.query(
      `INSERT INTO queue_history 
       (token_id, token_number, user_id, organization_id, service_id, counter_id, status, joined_at, called_at, completed_at, waiting_minutes)
       VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, NOW(), TIMESTAMPDIFF(MINUTE, ?, NOW()))`,
      [token.id, token.token_number, token.user_id, token.organization_id, token.service_id, token.counter_id, token.joined_at, token.called_at, token.joined_at]
    );

    // Notify customer
    await createNotification(
      token.user_id,
      `Your visit for Token ${token.token_number} (${token.service_name}) has been marked completed. Thank you!`,
      'QUEUE_COMPLETED'
    );

    const sId = serviceId || token.service_id;
    await updateNearTurnTokens(sId);
    const updatedState = await getServiceQueueState(sId);
    emitQueueUpdate(sId, updatedState);
    emitStaffUpdate(sId, updatedState);

    res.json({
      success: true,
      message: `Token ${token.token_number} completed successfully.`,
      queueState: updatedState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete token', error: error.message });
  }
};

/**
 * SKIP customer (absent / not responded)
 */
const skipToken = async (req, res) => {
  try {
    const { tokenId, serviceId } = req.body;
    let targetTokenId = tokenId;

    if (!targetTokenId && serviceId) {
      const [serving] = await pool.query(
        `SELECT id FROM queue_tokens 
         WHERE service_id = ? AND token_date = CURDATE() AND status = 'SERVING'
         ORDER BY called_at DESC LIMIT 1`,
        [serviceId]
      );
      if (serving.length > 0) targetTokenId = serving[0].id;
    }

    if (!targetTokenId) {
      return res.status(400).json({ success: false, message: 'No token specified to skip.' });
    }

    const [tokenRows] = await pool.query('SELECT * FROM queue_tokens WHERE id = ?', [targetTokenId]);
    if (tokenRows.length === 0) return res.status(404).json({ success: false, message: 'Token not found.' });

    const token = tokenRows[0];

    await pool.query(
      `UPDATE queue_tokens SET status = 'SKIPPED', completed_at = NOW() WHERE id = ?`,
      [targetTokenId]
    );

    await pool.query(
      `INSERT INTO queue_history 
       (token_id, token_number, user_id, organization_id, service_id, counter_id, status, joined_at, called_at, completed_at, waiting_minutes)
       VALUES (?, ?, ?, ?, ?, ?, 'SKIPPED', ?, ?, NOW(), TIMESTAMPDIFF(MINUTE, ?, NOW()))`,
      [token.id, token.token_number, token.user_id, token.organization_id, token.service_id, token.counter_id, token.joined_at, token.called_at, token.joined_at]
    );

    await createNotification(
      token.user_id,
      `Your Token ${token.token_number} was skipped as you did not respond. You can rejoin anytime.`,
      'INFO'
    );

    const sId = serviceId || token.service_id;
    await updateNearTurnTokens(sId);
    const updatedState = await getServiceQueueState(sId);
    emitQueueUpdate(sId, updatedState);
    emitStaffUpdate(sId, updatedState);

    res.json({
      success: true,
      message: `Token ${token.token_number} has been skipped.`,
      queueState: updatedState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * PUT ON HOLD
 */
const holdToken = async (req, res) => {
  try {
    const { tokenId, serviceId } = req.body;
    let targetTokenId = tokenId;

    if (!targetTokenId && serviceId) {
      const [serving] = await pool.query(
        `SELECT id FROM queue_tokens 
         WHERE service_id = ? AND token_date = CURDATE() AND status = 'SERVING'
         ORDER BY called_at DESC LIMIT 1`,
        [serviceId]
      );
      if (serving.length > 0) targetTokenId = serving[0].id;
    }

    if (!targetTokenId) {
      return res.status(400).json({ success: false, message: 'No token specified to put on hold.' });
    }

    const [tokenRows] = await pool.query('SELECT * FROM queue_tokens WHERE id = ?', [targetTokenId]);
    if (tokenRows.length === 0) return res.status(404).json({ success: false, message: 'Token not found.' });
    const token = tokenRows[0];

    await pool.query(`UPDATE queue_tokens SET status = 'ON_HOLD' WHERE id = ?`, [targetTokenId]);

    await createNotification(
      token.user_id,
      `Your Token ${token.token_number} has been temporarily placed on hold. Please check with staff when ready.`,
      'ON_HOLD'
    );

    const sId = serviceId || token.service_id;
    await updateNearTurnTokens(sId);
    const updatedState = await getServiceQueueState(sId);
    emitQueueUpdate(sId, updatedState);
    emitStaffUpdate(sId, updatedState);

    res.json({
      success: true,
      message: `Token ${token.token_number} placed on hold.`,
      queueState: updatedState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * RESUME ON-HOLD TOKEN
 */
const resumeToken = async (req, res) => {
  try {
    const { tokenId, serviceId } = req.body;
    if (!tokenId) {
      return res.status(400).json({ success: false, message: 'tokenId is required to resume.' });
    }

    const [tokenRows] = await pool.query('SELECT * FROM queue_tokens WHERE id = ?', [tokenId]);
    if (tokenRows.length === 0) return res.status(404).json({ success: false, message: 'Token not found.' });
    const token = tokenRows[0];

    await pool.query(`UPDATE queue_tokens SET status = 'WAITING' WHERE id = ?`, [tokenId]);

    await createNotification(
      token.user_id,
      `Your Token ${token.token_number} has been resumed and added back to the active queue.`,
      'INFO'
    );

    const sId = serviceId || token.service_id;
    await updateNearTurnTokens(sId);
    const updatedState = await getServiceQueueState(sId);
    emitQueueUpdate(sId, updatedState);
    emitStaffUpdate(sId, updatedState);

    res.json({
      success: true,
      message: `Token ${token.token_number} resumed.`,
      queueState: updatedState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * CANCEL TOKEN by Staff
 */
const cancelToken = async (req, res) => {
  try {
    const { tokenId, serviceId, reason } = req.body;
    if (!tokenId) {
      return res.status(400).json({ success: false, message: 'tokenId is required.' });
    }

    const [tokenRows] = await pool.query('SELECT * FROM queue_tokens WHERE id = ?', [tokenId]);
    if (tokenRows.length === 0) return res.status(404).json({ success: false, message: 'Token not found.' });
    const token = tokenRows[0];

    await pool.query(
      `UPDATE queue_tokens SET status = 'CANCELLED', completed_at = NOW(), notes = ? WHERE id = ?`,
      [reason || 'Cancelled by staff', tokenId]
    );

    await pool.query(
      `INSERT INTO queue_history 
       (token_id, token_number, user_id, organization_id, service_id, counter_id, status, joined_at, called_at, completed_at, waiting_minutes)
       VALUES (?, ?, ?, ?, ?, ?, 'CANCELLED', ?, ?, NOW(), TIMESTAMPDIFF(MINUTE, ?, NOW()))`,
      [token.id, token.token_number, token.user_id, token.organization_id, token.service_id, token.counter_id, token.joined_at, token.called_at, token.joined_at]
    );

    await createNotification(
      token.user_id,
      `Your Token ${token.token_number} was cancelled by staff. Reason: ${reason || 'Not specified'}.`,
      'QUEUE_CANCELLED'
    );

    const sId = serviceId || token.service_id;
    await updateNearTurnTokens(sId);
    const updatedState = await getServiceQueueState(sId);
    emitQueueUpdate(sId, updatedState);
    emitStaffUpdate(sId, updatedState);

    res.json({
      success: true,
      message: `Token ${token.token_number} cancelled.`,
      queueState: updatedState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStaffAssignment,
  callNext,
  completeToken,
  skipToken,
  holdToken,
  resumeToken,
  cancelToken
};
