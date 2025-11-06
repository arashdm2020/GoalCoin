import express from 'express';
import { reviewController } from '../controllers/reviewController';

const router = express.Router();

router.get('/assignments/:reviewer_wallet', reviewController.getAssignedSubmissions);
router.post('/vote', reviewController.submitVote);
router.get('/history/:reviewer_wallet', reviewController.getReviewHistory);

export { router as reviewRoutes };
