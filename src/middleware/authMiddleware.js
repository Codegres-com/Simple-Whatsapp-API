require('dotenv').config();

const API_KEY = process.env.API_KEY;

/**
 * Middleware to protect routes with an API key.
 */
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.get('X-API-KEY');

    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid API key.' });
    }

    next();
};

module.exports = apiKeyAuth;