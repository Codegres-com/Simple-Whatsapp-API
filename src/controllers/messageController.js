const { sendMessage, sendAttachment } = require('../services/sessionManager');
const { getSessionId } = require('../utils/apiKeyExtractor');

/**
 * Handles the /send-message endpoint.
 */
const sendTextMessage = async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({ error: 'Missing required parameters: to, message' });
    }

    try {
        await sendMessage(sessionId, to, message);
        res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error(`[${sessionId}] Failed to send message:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const fs = require('fs');

/**
 * Handles the /send-attachment endpoint.
 * Can handle direct file uploads (multipart/form-data) or URL/Base64 from JSON body.
 */
const sendAttachmentMessage = async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    const { to, caption } = req.body;
    if (!to) {
        return res.status(400).json({ error: 'Missing required parameter: to' });
    }

    try {
        if (req.file) {
            // A file was uploaded directly with the request
            await sendAttachment(sessionId, to, req.file.path, caption);
            // Clean up the temporary file after sending
            fs.unlinkSync(req.file.path);
            res.status(200).json({ success: true, message: 'Attachment sent successfully from uploaded file.' });
        } else {
            // No file uploaded, expect `file` and `type` in the body for URL/Base64
            const { file, type } = req.body;
            if (!file) {
                return res.status(400).json({ error: 'Missing "file" in request body or as an uploaded file.' });
            }
            await sendAttachment(sessionId, to, file, caption, type);
            res.status(200).json({ success: true, message: 'Attachment sent successfully from URL/Base64.' });
        }
    } catch (error) {
        console.error(`[${sessionId}] Failed to send attachment:`, error);
        // If a file was uploaded, ensure it's cleaned up on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Handles the GET /send endpoint for sending messages and attachments.
 */
const sendFromApi = async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    const { number, message, attachmentUrl } = req.query;

    if (!number || (!message && !attachmentUrl)) {
        return res.status(400).json({ error: 'Missing required query parameters: number and either message or attachmentUrl' });
    }

    try {
        if (attachmentUrl) {
            // If there's an attachment, send it with the message as a caption
            await sendAttachment(sessionId, number, attachmentUrl, message || '');
            res.status(200).json({ success: true, message: 'Attachment sent successfully.' });
        } else {
            // Otherwise, send a simple text message
            await sendMessage(sessionId, number, message);
            res.status(200).json({ success: true, message: 'Message sent successfully.' });
        }
    } catch (error) {
        console.error(`[${sessionId}] Failed to send message via GET API:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    sendTextMessage,
    sendAttachmentMessage,
    sendFromApi
};