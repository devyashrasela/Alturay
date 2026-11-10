const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadImageBuffer } = require('../services/cloudinaryService');
const logger = require('../utils/logger');

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

      // 1. Try Cloudinary if credentials might be valid
      let uploadResult = null;
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer, {
          folder: 'alturay/logos',
        });
      } catch (cloudErr) {
        logger.warn(`Cloudinary upload failed (${cloudErr.message}). Falling back to local storage.`);
      }

      if (uploadResult && uploadResult.url) {
        return res.json({
          success: true,
          data: {
            url: uploadResult.url,
            public_id: uploadResult.public_id,
          },
        });
      }

      // 2. Fallback: Save directly to server uploads directory
      const uploadDir = path.join(__dirname, '../../uploads/logos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const mimeToExt = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/webp': 'webp',
      };
      const ext = mimeToExt[req.file.mimetype] || 'png';
      const filename = `logo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.get('host') || `localhost:${process.env.PORT || 8001}`;
      const localUrl = `${protocol}://${host}/uploads/logos/${filename}`;

      return res.json({
        success: true,
        data: {
          url: localUrl,
          public_id: filename,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
