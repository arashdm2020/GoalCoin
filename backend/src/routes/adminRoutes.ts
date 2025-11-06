import express from 'express';
import { adminController } from '../controllers/adminController';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = express.Router();

// Reviewer management
router.post('/reviewers', basicAuthMiddleware, adminController.addReviewer);
router.get('/reviewers', basicAuthMiddleware, adminController.listReviewers);
router.put('/reviewers/status', basicAuthMiddleware, adminController.toggleReviewerStatus);

// Submission management
router.get('/submissions', basicAuthMiddleware, adminController.getSubmissions);
router.post('/submissions/assign', basicAuthMiddleware, adminController.assignSubmissionReviewers);

// Commission and payout management
router.get('/commissions', basicAuthMiddleware, adminController.getCommissions);
router.post('/payouts', basicAuthMiddleware, adminController.createPayout);

export { router as adminRoutes };
