import express from 'express';
import { submissionController } from '../controllers/submissionController';

const router = express.Router();

router.post('/', submissionController.createSubmission);
router.get('/user/:user_wallet', submissionController.getUserSubmissions);
router.get('/:id', submissionController.getSubmissionById);

export { router as submissionRoutes };
