import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter to accept only images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedExtensions = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  
  // Check mimetype - accept all image/* and video/* types
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if ((isImage || isVideo) && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG, GIF) and videos (MP4, MOV, AVI, WEBM) are allowed!'));
  }
};

// Multer upload configuration
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: fileFilter,
});
