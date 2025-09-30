const { sendMessage, sendAttachment } = require('../services/whatsapp');

/**
 * Handles the /send-message endpoint.
 */
const sendTextMessage = async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Missing required parameters: to, message' });
    }

    try {
        await sendMessage(to, message);
        res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Handles the /send-attachment endpoint.
 */
const sendAttachmentMessage = async (req, res) => {
    const { to, file, caption, type } = req.body;

    if (!to || !file || !type) {
        return res.status(400).json({ error: 'Missing required parameters: to, file, type' });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
    if (!file.startsWith('http') && !allowedTypes.includes(type)) {
         return res.status(400).json({ error: 'Invalid file type for Base64 upload. Supported types: ' + allowedTypes.join(', ') });
    }


    try {
        await sendAttachment(to, file, caption, type);
        res.status(200).json({ success: true, message: 'Attachment sent successfully.' });
    } catch (error) {
        console.error('Failed to send attachment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    sendTextMessage,
    sendAttachmentMessage
};