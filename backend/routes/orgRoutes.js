const express = require('express');
const router = express.Router();
const {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
} = require('../controllers/orgController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes for customers
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);

// Admin-protected routes
router.post('/', authenticate, authorize('ADMIN'), createOrganization);
router.put('/:id', authenticate, authorize('ADMIN'), updateOrganization);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteOrganization);

module.exports = router;
