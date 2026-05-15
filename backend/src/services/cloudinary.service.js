const cloudinary = require('cloudinary').v2;

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET,
  );
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload image bytes to Cloudinary; returns HTTPS URL for MongoDB.
 * @param {Buffer} buffer
 * @param {string} _mimetype — reserved for future format hints
 * @returns {Promise<string>} secure_url
 */
function uploadImageBuffer(buffer, _mimetype) {
  if (!isConfigured()) {
    return Promise.reject(new Error('Cloudinary is not configured'));
  }
  configure();

  const folder = (process.env.CLOUDINARY_FOLDER || 'trendypos/products').replace(/^\/+|\/+$/g, '');

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

module.exports = {
  isConfigured,
  uploadImageBuffer,
};
