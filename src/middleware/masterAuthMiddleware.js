require('dotenv').config();
const { logAccess } = require('../utils/logger');

/**
 * Parses configured master API keys from environment variables.
 * Returns a Map of key -> appName.
 */
const getRegisteredKeysMap = () => {
    const keyMap = new Map();

    const rawKeys = process.env.MASTER_API_KEYS;
    if (rawKeys) {
        let parsed = false;
        // Try JSON parsing
        if (rawKeys.trim().startsWith('{')) {
            try {
                const jsonObj = JSON.parse(rawKeys);
                for (const [k, v] of Object.entries(jsonObj)) {
                    keyMap.set(k.trim(), String(v).trim());
                }
                parsed = true;
            } catch (e) {}
        }
        // If not JSON, parse key:appName pairs or comma-separated list
        if (!parsed) {
            const pairs = rawKeys.split(',');
            for (const item of pairs) {
                const trimmed = item.trim();
                if (!trimmed) continue;
                if (trimmed.includes(':')) {
                    const parts = trimmed.split(':');
                    const k = parts[0].trim();
                    const app = parts.slice(1).join(':').trim();
                    if (k) keyMap.set(k, app || 'RegisteredApp');
                } else {
                    keyMap.set(trimmed, 'RegisteredApp');
                }
            }
        }
    }

    // Fallback or legacy MASTER_API_KEY support
    if (process.env.MASTER_API_KEY) {
        const legacyKey = process.env.MASTER_API_KEY.trim();
        if (!keyMap.has(legacyKey)) {
            keyMap.set(legacyKey, 'DefaultMasterApp');
        }
    }

    return keyMap;
};

/**
 * Middleware to protect all API routes with Master API keys.
 * Supports multiple keys assigned to different apps, and logs daily access.
 */
const masterApiKeyAuth = (req, res, next) => {
    const masterKey = req.get('X-MASTER-KEY') || (req.body ? req.body['X-MASTER-KEY'] : undefined);
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const registeredKeys = getRegisteredKeysMap();

    if (registeredKeys.size === 0) {
        console.error("No MASTER_API_KEYS or MASTER_API_KEY configured in environment.");
        return res.status(500).json({ error: 'Server configuration error: No master API keys configured.' });
    }

    if (!masterKey || !registeredKeys.has(masterKey)) {
        const keyMasked = masterKey ? `${masterKey.substring(0, Math.min(3, masterKey.length))}***` : 'NONE';
        logAccess({
            appName: 'UNAUTHORIZED',
            keyMasked,
            endpoint: req.originalUrl || req.url,
            method: req.method,
            ip,
            status: 401,
            details: 'Invalid or missing master API key'
        });
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid Master API key.' });
    }

    const appName = registeredKeys.get(masterKey);
    req.appName = appName;
    const keyMasked = `${masterKey.substring(0, Math.min(3, masterKey.length))}***`;

    logAccess({
        appName,
        keyMasked,
        endpoint: req.originalUrl || req.url,
        method: req.method,
        ip,
        status: 200
    });

    next();
};

module.exports = masterApiKeyAuth;