const express = require('express');
const router = express.Router();
const {
  getServicesByOrg,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route to view services for an organization
router.get('/:organizationId', getServicesByOrg);

// Admin routes
router.post('/', authenticate, authorize('ADMIN'), createService);
router.put('/:id', authenticate, authorize('ADMIN'), updateService);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteService);

module.exports = router;
