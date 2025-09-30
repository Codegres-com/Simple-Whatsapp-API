const { sendMessage, sendAttachment } = require('../services/sessionManager');

/**
 * Extracts the session ID from the request headers.
 * @param {import('express').Request} req - The Express request object.
 * @returns {string|null} The session ID or null if not found.
 */
const getSessionId = (req) => {
    return req.get('X-API-KEY');
};

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

/**
 * Handles the /send-attachment endpoint.
 */
const sendAttachmentMessage = async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    const { to, file, caption, type } = req.body;

    if (!to || !file || !type) {
        return res.status(400).json({ error: 'Missing required parameters: to, file, type' });
    }

    try {
        await sendAttachment(sessionId, to, file, caption, type);
        res.status(200).json({ success: true, message: 'Attachment sent successfully.' });
    } catch (error) {
        console.error(`[${sessionId}] Failed to send attachment:`, error);
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