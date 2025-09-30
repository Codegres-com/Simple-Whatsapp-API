const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = './uploads';

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
}).single('file');

/**
 * Handles the /upload endpoint.
 */
const uploadFile = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Schedule file deletion after 5 minutes
        setTimeout(() => {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Failed to delete temporary file: ${req.file.path}`, unlinkErr);
                } else {
                    console.log(`Deleted temporary file: ${req.file.path}`);
                }
            });
        }, 5 * 60 * 1000); // 5 minutes

        res.status(200).json({
            message: 'File uploaded successfully.',
            url: fileUrl
        });
    });
};

module.exports = {
    uploadFile
};