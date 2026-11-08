const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadImageBuffer } = require('../services/cloudinaryService');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files (PNG, JPEG, WEBP) are allowed.'));
    }
    cb(null, true);
  },
});

router.post(
  '/image',
  authMiddleware,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No image file uploaded.' },
        });
      }

      const uploadResult = await uploadImageBuffer(req.file.buffer, {
        folder: 'alturay/logos',
      });

      return res.json({
        success: true,
        data: {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        },
      });
    } catch (error) {
      if (error.message && error.message.includes('Cloudinary is not configured')) {
        return res.status(503).json({
          success: false,
          error: {
            code: 'STORAGE_NOT_CONFIGURED',
            message: error.message,
          },
        });
      }
      next(error);
    }
  }
);

module.exports = router;
