import express from 'express';
import { uploadController } from '../controllers/uploadController';
import { upload } from '../middleware/upload';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/upload
 * Upload a file (image or video) to Cloudinary
 */
router.post('/', authMiddleware, upload.single('file'), uploadController.uploadFile);

export default router;
