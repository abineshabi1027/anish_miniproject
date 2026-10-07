const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getAnalytics,
  getUsers,
  updateUser,
  getCounters,
  createCounter,
  deleteCounter,
  getAllQueues
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all admin routes
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboardOverview);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/counters', getCounters);
router.post('/counters', createCounter);
router.delete('/counters/:id', deleteCounter);
router.get('/queues', getAllQueues);

module.exports = router;
