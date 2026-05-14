const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isServerless = Boolean(process.env.VERCEL);

let storage;
if (isServerless) {
  storage = multer.memoryStorage();
} else {
  const uploadDir = path.join(__dirname, '../../uploads/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  });
}

const fileFilter = (_req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { uploadProductImage };
