import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxat5z9j1',
  api_key: process.env.CLOUDINARY_API_KEY || '577365329656591',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hGp4vdYNtqBu-q-ak-pW2Om7Rzk',
});

export default cloudinary;
