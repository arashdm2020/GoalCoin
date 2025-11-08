import express from 'express';
import authController from '../controllers/authController';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register with email and password
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/link-wallet
 * Link wallet to existing email account (requires JWT)
 */
router.post('/link-wallet', authController.linkWallet);

/**
 * GET /api/auth/me
 * Get current user info (requires JWT)
 */
router.get('/me', authController.getMe);

export { router as authRoutes };
