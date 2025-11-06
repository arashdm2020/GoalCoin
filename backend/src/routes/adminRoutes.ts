import express from 'express';
import { adminController } from '../controllers/adminController';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = express.Router();

/**
 * GET /api/admin/users
 * Protected endpoint to retrieve all users ordered by latest connection
 */
router.get('/users', basicAuthMiddleware, adminController.getUsers);

router.get('/verifiers', basicAuthMiddleware, adminController.getVerifiers);
router.post('/verifiers', basicAuthMiddleware, adminController.createVerifier);
router.post('/verify', basicAuthMiddleware, adminController.verify);
router.get('/verification-status', basicAuthMiddleware, adminController.verificationStatus);
router.get('/commissions', basicAuthMiddleware, adminController.commissions);

export { router as adminRoutes };
