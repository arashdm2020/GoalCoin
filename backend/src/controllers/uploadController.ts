import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export const uploadController = {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Convert buffer to stream for Cloudinary
      const stream = Readable.from(req.file.buffer);

      // Determine resource type based on mimetype
      const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

      // Upload to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'goalcoin/submissions',
            resource_type: resourceType,
            transformation: resourceType === 'image' 
              ? [{ quality: 'auto', fetch_format: 'auto' }]
              : [{ quality: 'auto' }],
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.pipe(uploadStream);
      });

      const result: any = await uploadPromise;

      res.status(200).json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        size: result.bytes,
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
