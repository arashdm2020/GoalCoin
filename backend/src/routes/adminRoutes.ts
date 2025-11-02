import express from 'express';
import { adminController } from '../controllers/adminController';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = express.Router();

/**
 * GET /api/admin/users
 * Protected endpoint to retrieve all users ordered by latest connection
 */
router.get('/users', basicAuthMiddleware, adminController.getUsers);

export { router as adminRoutes };
