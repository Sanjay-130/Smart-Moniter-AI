import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.toLowerCase(),
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'smart-monitor-ai',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const uploadBase64 = async (base64String, folderName = 'smart-monitor-ai') => {
  try {
    console.log(`Uploading base64 image to Cloudinary folder: ${folderName}...`);
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: folderName,
    });
    console.log('Cloudinary Upload Success:', uploadResponse.secure_url);
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary Base64 Upload Error Details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name
    });
    throw error;
  }
};

export { cloudinary, storage, uploadBase64 };
