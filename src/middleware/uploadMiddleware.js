const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = './uploads';

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

/**
 * Multer instance for handling file uploads.
 * - Saves files to the 'uploads' directory.
 * - Enforces a 25MB file size limit.
 */
const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

module.exports = upload;