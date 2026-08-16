const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = './uploads';

/**
 * Cleans up temporary uploaded files older than maxAgeMinutes.
 * @param {number} maxAgeMinutes
 * @returns {{cleanedCount: number, cleanedFiles: string[], thresholdMinutes: number}}
 */
const cleanUploadedFiles = (maxAgeMinutes = 5) => {
    const minutes = parseFloat(maxAgeMinutes) || 5;
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    const cleanedFiles = [];

    if (!fs.existsSync(UPLOADS_DIR)) {
        return { cleanedCount: 0, cleanedFiles, thresholdMinutes: minutes };
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        try {
            const stats = fs.statSync(filePath);
            if (stats.isFile() && stats.mtimeMs < cutoffTime) {
                fs.unlinkSync(filePath);
                cleanedFiles.push(file);
                console.log(`Cleaned temporary uploaded file: ${file}`);
            }
        } catch (err) {
            console.error(`Failed to inspect/delete file ${file}:`, err.message);
        }
    }

    return {
        cleanedCount: cleanedFiles.length,
        cleanedFiles,
        thresholdMinutes: minutes
    };
};

/**
 * Handles the /upload endpoint.
 * This controller relies on the 'upload.single("file")' middleware being applied to the route.
 */
const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const ttlMinutes = parseFloat(process.env.UPLOAD_FILE_TTL_MINUTES || '5');

    // Schedule file deletion
    setTimeout(() => {
        if (fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Failed to delete temporary file: ${req.file.path}`, unlinkErr);
                } else {
                    console.log(`Deleted temporary file: ${req.file.path}`);
                }
            });
        }
    }, ttlMinutes * 60 * 1000);

    res.status(200).json({
        message: 'File uploaded successfully.',
        url: fileUrl,
        expiresInMinutes: ttlMinutes
    });
};

/**
 * Endpoint handler for manual upload cleanup.
 */
const cleanupUploads = (req, res) => {
    try {
        const minutes = parseFloat(req.query.minutes || (req.body ? req.body.minutes : undefined) || process.env.UPLOAD_FILE_TTL_MINUTES || 5);
        const result = cleanUploadedFiles(minutes);
        res.status(200).json({
            success: true,
            message: `Cleanup completed. Removed ${result.cleanedCount} file(s) older than ${result.thresholdMinutes} minute(s).`,
            cleanedCount: result.cleanedCount,
            cleanedFiles: result.cleanedFiles,
            thresholdMinutes: result.thresholdMinutes
        });
    } catch (error) {
        console.error('Failed to cleanup uploads:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Run automatic background cleanup every 10 minutes on server
setInterval(() => {
    try {
        const ttlMinutes = parseFloat(process.env.UPLOAD_FILE_TTL_MINUTES || '5');
        cleanUploadedFiles(ttlMinutes);
    } catch (err) {}
}, 10 * 60 * 1000);

module.exports = {
    uploadFile,
    cleanupUploads,
    cleanUploadedFiles
};