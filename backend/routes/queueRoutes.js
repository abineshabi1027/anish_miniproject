const express = require('express');
const router = express.Router();
const {
  joinQueue,
  getTokenDetails,
  leaveQueue,
  getServiceQueue,
  getUserActiveTokens,
  getUserQueueHistory
} = require('../controllers/queueController');
const {
  getStaffAssignment,
  callNext,
  completeToken,
  skipToken,
  holdToken,
  resumeToken,
  cancelToken
} = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

// Customer Queue Routes
router.post('/join', authenticate, joinQueue);
router.get('/my-active', authenticate, getUserActiveTokens);
router.get('/my-history', authenticate, getUserQueueHistory);
router.get('/service/:serviceId', getServiceQueue);
router.get('/:tokenId', authenticate, getTokenDetails);
router.post('/:tokenId/leave', authenticate, leaveQueue);

// Staff Queue Operations (Protected: STAFF, ADMIN)
router.get('/staff/assignment', authenticate, authorize('STAFF', 'ADMIN'), getStaffAssignment);
router.post('/call-next', authenticate, authorize('STAFF', 'ADMIN'), callNext);
router.post('/complete', authenticate, authorize('STAFF', 'ADMIN'), completeToken);
router.post('/skip', authenticate, authorize('STAFF', 'ADMIN'), skipToken);
router.post('/hold', authenticate, authorize('STAFF', 'ADMIN'), holdToken);
router.post('/resume', authenticate, authorize('STAFF', 'ADMIN'), resumeToken);
router.post('/cancel', authenticate, authorize('STAFF', 'ADMIN'), cancelToken);

module.exports = router;
