const fs = require('fs');

/**
 * Handles the /upload endpoint.
 * This controller relies on the 'upload.single("file")' middleware being applied to the route.
 */
const uploadFile = (req, res) => {
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
};

module.exports = {
    uploadFile
};