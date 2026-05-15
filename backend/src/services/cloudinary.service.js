const cloudinary = require('cloudinary').v2;

/**
 * True if CLOUDINARY_URL is set (recommended), or all three legacy vars are set.
 * Rejects obvious template placeholders.
 */
function isConfigured() {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url && url.startsWith('cloudinary://') && !url.includes('<') && !url.includes('your_')) {
    return true;
  }
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET,
  );
}

function parseCloudinaryUrl(urlString) {
  const u = new URL(urlString);
  if (u.protocol !== 'cloudinary:') {
    throw new Error("CLOUDINARY_URL must start with 'cloudinary://'");
  }
  const apiKey = decodeURIComponent(u.username || '');
  const apiSecret = decodeURIComponent(u.password || '');
  const cloudName = u.hostname;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('CLOUDINARY_URL is missing cloud name, API key, or API secret');
  }
  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
}

function configure() {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url && url.startsWith('cloudinary://') && !url.includes('<')) {
    const parsed = parseCloudinaryUrl(url);
    cloudinary.config({ ...parsed, secure: true });
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
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
