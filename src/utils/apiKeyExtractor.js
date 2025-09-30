/**
 * Extracts the session ID (API key) from the request.
 * It checks the 'X-API-KEY' header first, then falls back to the request body.
 *
 * @param {import('express').Request} req - The Express request object.
 * @returns {string|null} The session ID or null if not found.
 */
const getSessionId = (req) => {
    const fromHeader = req.get('X-API-KEY');
    if (fromHeader) {
        return fromHeader;
    }

    if (req.body && req.body['X-API-KEY']) {
        return req.body['X-API-KEY'];
    }

    return null;
};

module.exports = {
    getSessionId,
};