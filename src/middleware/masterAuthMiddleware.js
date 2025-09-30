require('dotenv').config();

const MASTER_API_KEY = process.env.MASTER_API_KEY;

/**
 * Middleware to protect all API routes with a Master API key.
 * The key can be provided in the 'X-MASTER-KEY' header or in the request body.
 */
const masterApiKeyAuth = (req, res, next) => {
    // Check for the key in the header first, then in the body.
    const masterKey = req.get('X-MASTER-KEY') || (req.body ? req.body['X-MASTER-KEY'] : undefined);

    if (!MASTER_API_KEY) {
        // If the master key is not set in the environment, deny all requests.
        console.error("MASTER_API_KEY is not set in the environment.");
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    if (!masterKey || masterKey !== MASTER_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid Master API key.' });
    }

    next();
};

module.exports = masterApiKeyAuth;