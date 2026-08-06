import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = (fileBuffer, folder = 'agburu_profiles') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};