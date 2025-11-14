import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export const uploadController = {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(req.file.originalname);
      const filename = `${timestamp}-${randomStr}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file to disk
      fs.writeFileSync(filepath, req.file.buffer);

      // Generate public URL
      const baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3001';
      const fileUrl = `${baseUrl}/uploads/${filename}`;

      res.status(200).json({
        success: true,
        url: fileUrl,
        filename: filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload file',
        details: error.message 
      });
    }
  },
};
