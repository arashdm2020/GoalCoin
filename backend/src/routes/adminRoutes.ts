import express from 'express';
import { adminController } from '../controllers';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = express.Router();

// Dashboard stats
router.get('/dashboard-stats', basicAuthMiddleware, adminController.getDashboardStats);

// User management
router.get('/users', basicAuthMiddleware, adminController.getUsers);

// Reviewer management
router.get('/reviewers', basicAuthMiddleware, adminController.listReviewers);
router.post('/reviewers', basicAuthMiddleware, adminController.addReviewer);
router.put('/reviewers/status', basicAuthMiddleware, adminController.toggleReviewerStatus);
router.post('/reviewers/reset-strikes', basicAuthMiddleware, adminController.resetStrikes);
router.get('/reviewers/:reviewerId/audit', basicAuthMiddleware, adminController.getReviewerAudit);

// Submission management
router.get('/submissions', basicAuthMiddleware, adminController.getSubmissions);
router.post('/submissions/assign', basicAuthMiddleware, adminController.assignSubmissionReviewers);
router.post('/submissions/close', basicAuthMiddleware, adminController.closeSubmission);
router.put('/submissions/status', basicAuthMiddleware, adminController.forceUpdateSubmissionStatus);
router.post('/submissions/bulk-status', basicAuthMiddleware, adminController.bulkUpdateSubmissionStatus);

// Commission and payout management
router.get('/commissions', basicAuthMiddleware, adminController.getCommissions);
router.get('/commissions/preview', basicAuthMiddleware, adminController.previewCommissions);
router.post('/commissions/mark-paid', basicAuthMiddleware, adminController.markCommissionsPaid);
router.post('/payouts', basicAuthMiddleware, adminController.createPayout);
router.post('/commissions/manual', basicAuthMiddleware, adminController.addManualCommission);

// Leaderboard management
router.get('/leaderboard', basicAuthMiddleware, adminController.getLeaderboard);
router.post('/leaderboard/recalculate', basicAuthMiddleware, adminController.recalculateLeaderboard);

// Settings management
router.get('/settings/status', basicAuthMiddleware, adminController.getSystemStatus);
router.get('/settings/feature-toggles', basicAuthMiddleware, adminController.getFeatureToggles);
router.put('/settings/feature-toggles', basicAuthMiddleware, adminController.updateFeatureToggle);
router.get('/settings/security-logs', basicAuthMiddleware, adminController.getAdminSecurityLogs);
router.post('/settings/verify-burn', basicAuthMiddleware, adminController.verifyBurnRecord);

// MVP Testing - Clear all users
router.get('/export-csv', basicAuthMiddleware, adminController.exportCsv);

// MVP Testing - Clear all users
router.delete('/users/clear-all', basicAuthMiddleware, adminController.clearAllUsers);

export { router as adminRoutes };
