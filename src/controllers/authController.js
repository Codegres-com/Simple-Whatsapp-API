const qrcode = require('qrcode');
const { getStatus, initializeClient } = require('../services/sessionManager');
const { getSessionId } = require('../utils/apiKeyExtractor');

/**
 * Handles the /connect endpoint.
 * Returns the QR code string for the session if available, otherwise the current status.
 */
const getQrCodeString = (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    // Initialize or get the session
    initializeClient(sessionId);
    const { status, qrCode } = getStatus(sessionId);

    if (status === 'QR Code Generated' && qrCode) {
        res.status(200).send(qrCode);
    } else {
        res.status(200).json({ sessionId, status });
    }
};

/**
 * Handles the /connect/image endpoint.
 * Returns the QR code for the session as a PNG image.
 */
const getQrCodeImage = (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    // Initialize or get the session
    initializeClient(sessionId);
    const { status, qrCode } = getStatus(sessionId);

    if (status === 'QR Code Generated' && qrCode) {
        qrcode.toBuffer(qrCode, (err, buffer) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate QR code image.' });
            }
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        });
    } else {
        res.status(404).json({ error: 'QR code not available.', sessionId, status });
    }
};

module.exports = {
    getQrCodeString,
    getQrCodeImage
};