const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Maximum file size: 20 MB in bytes
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20,971,520 bytes

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random prefix + sanitized extension
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `paper-${uniqueSuffix}${ext}`);
  },
});

// Strict PDF validator checking both MIME type and extension
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const isPdfExtension = ext === '.pdf';
  const isPdfMime = mime === 'application/pdf';

  if (isPdfExtension && isPdfMime) {
    return cb(null, true);
  }

  return cb(
    new ApiError(400, 'Invalid file type. Only PDF files (.pdf) are allowed.'),
    false
  );
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Express middleware wrapper for single PDF upload on field 'file'
 */
const uploadSinglePdf = (req, res, next) => {
  const singleUpload = upload.single('file');

  singleUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(400, 'File size exceeds the maximum allowed limit of 20 MB.')
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new ApiError(
              400,
              `Unexpected field "${err.field}". Please upload the PDF using the field name "file".`
            )
          );
        }
        return next(new ApiError(400, `Upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  uploadSinglePdf,
  uploadDir,
  MAX_FILE_SIZE,
};
