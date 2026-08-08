const qrcode = require('qrcode');
const { getStatus, initializeClient, waitForSession } = require('../services/sessionManager');
const { getSessionId } = require('../utils/apiKeyExtractor');

/**
 * Handles the /connect endpoint.
 * Returns the QR code string for the session if available, otherwise the current status.
 */
const getQrCodeString = async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    // Wait for session to generate QR or reach status
    const { status, qrCode } = await waitForSession(sessionId);

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
const getQrCodeImage = async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    // Wait for session to generate QR or reach status
    const { status, qrCode } = await waitForSession(sessionId);

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

/**
 * Handles closing a specific session.
 */
const logout = async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(400).json({ error: 'X-API-KEY header is required.' });
    }

    try {
        const { destroySession } = require('../services/sessionManager');
        await destroySession(sessionId);
        res.status(200).json({ success: true, message: `Session ${sessionId} has been closed and removed.` });
    } catch (error) {
        console.error(`Failed to logout session ${sessionId}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Handles closing all active sessions and cleaning up session data.
 */
const logoutAll = async (req, res) => {
    try {
        const { destroyAllSessions } = require('../services/sessionManager');
        await destroyAllSessions();
        res.status(200).json({ success: true, message: 'All active sessions have been closed and data removed.' });
    } catch (error) {
        console.error('Failed to logout all sessions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Handles cleaning up inactive/abandoned sessions.
 */
const cleanupInactive = async (req, res) => {
    try {
        const { cleanInactiveSessions } = require('../services/sessionManager');
        const days = parseFloat(req.query.days || (req.body ? req.body.days : undefined) || 7);
        const result = await cleanInactiveSessions(days);
        res.status(200).json({
            success: true,
            message: `Cleanup completed. Removed ${result.cleanedCount} inactive session(s) older than ${result.thresholdDays} day(s).`,
            cleanedCount: result.cleanedCount,
            cleanedSessions: result.cleanedSessions,
            thresholdDays: result.thresholdDays
        });
    } catch (error) {
        console.error('Failed to clean inactive sessions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getQrCodeString,
    getQrCodeImage,
    logout,
    logoutAll,
    cleanupInactive
};