import express from 'express';
import membershipController from '../controllers/membershipController';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = express.Router();

/**
 * All membership routes require admin authentication
 */
router.use(basicAuthMiddleware);

/**
 * GET /api/admin/memberships
 * Get all memberships with filters and pagination
 */
router.get('/', membershipController.getMemberships);

/**
 * GET /api/admin/memberships/stats
 * Get membership statistics
 */
router.get('/stats', membershipController.getStats);

/**
 * GET /api/admin/memberships/export
 * Export memberships to CSV
 */
router.get('/export', membershipController.exportCSV);

/**
 * PUT /api/admin/memberships/status
 * Update payment status (manual override)
 */
router.put('/status', membershipController.updatePaymentStatus);

export default router;
