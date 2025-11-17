import express from 'express';
import { submissionController } from '../controllers/submissionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', submissionController.createSubmission);
router.get('/my-submissions', authMiddleware, submissionController.getMySubmissions);
router.get('/user/:user_wallet', submissionController.getUserSubmissions);
router.get('/:id', submissionController.getSubmissionById);

export { router as submissionRoutes };
