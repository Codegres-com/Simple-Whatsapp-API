const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');

// Path to the sessions directory
const SESSIONS_DIR = './sessions';

// Ensure the sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// In-memory store for WhatsApp clients and their statuses
const sessions = new Map();

/**
 * Initializes or retrieves a WhatsApp client for a given session ID.
 * @param {string} sessionId - The unique identifier for the session.
 * @returns {Client} The WhatsApp client instance.
 */
const initializeClient = (sessionId) => {
    if (sessions.has(sessionId) && sessions.get(sessionId).client) {
        return sessions.get(sessionId);
    }

    console.log(`Initializing WhatsApp client for session: ${sessionId}`);
    const sessionDataPath = `${SESSIONS_DIR}/session-${sessionId}`;

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: sessionDataPath }),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        },
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    const session = {
        id: sessionId,
        client: client,
        qrCode: null,
        status: 'Initializing'
    };
    sessions.set(sessionId, session);

    client.on('qr', (qr) => {
        console.log(`QR code received for session: ${sessionId}`);
        session.qrCode = qr;
        session.status = 'QR Code Generated';
    });

    client.on('ready', () => {
        console.log(`WhatsApp client is ready for session: ${sessionId}`);
        session.qrCode = null;
        session.status = 'Connected';
    });

    client.on('authenticated', () => {
        console.log(`Authentication successful for session: ${sessionId}`);
        session.status = 'Connected';
    });

    client.on('auth_failure', (msg) => {
        console.error(`Authentication failure for session ${sessionId}:`, msg);
        session.status = 'Authentication Failure';
        sessions.delete(sessionId);
        try {
            if (fs.existsSync(sessionDataPath)) {
                fs.rmSync(sessionDataPath, { recursive: true, force: true });
            }
        } catch (err) {
            console.error(`Error deleting session dir for ${sessionId}:`, err);
        }
    });

    client.on('disconnected', async (reason) => {
        console.log(`Client for session ${sessionId} was logged out:`, reason);
        session.status = 'Disconnected';
        sessions.delete(sessionId);
        try {
            await client.destroy();
        } catch (err) {
            // Silently ignore target closed errors during destroy
        }
        try {
            if (fs.existsSync(sessionDataPath)) {
                fs.rmSync(sessionDataPath, { recursive: true, force: true });
            }
        } catch (err) {
            console.error(`Error deleting session dir for ${sessionId}:`, err);
        }
    });

    client.initialize().catch(err => {
        console.error(`Failed to initialize client for session ${sessionId}:`, err);
        sessions.delete(sessionId);
    });

    return session;
};

/**
 * Retrieves the status of a specific session.
 * @param {string} sessionId - The session ID.
 * @returns {{status: string, qrCode?: string, id: string}}
 */
const getStatus = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
        return {
            id: sessionId,
            status: 'Disconnected',
            qrCode: null
        };
    }
    return {
        id: session.id,
        status: session.status,
        qrCode: session.qrCode
    };
};

/**
 * Helper to get the correct WhatsApp serialized chat ID.
 */
const getFormattedChatId = async (client, to) => {
    let cleanNumber = to.replace(/[^0-9]/g, '');
    let formatted = `${cleanNumber}@c.us`;
    try {
        const numberDetails = await client.getNumberId(cleanNumber);
        if (numberDetails && numberDetails._serialized) {
            formatted = numberDetails._serialized;
        }
    } catch (err) {
        console.warn(`getNumberId check failed for ${to}, using ${formatted}`);
    }
    return formatted;
};

const { validateAntiSpam } = require('../utils/spamProtector');

/**
 * Sends a text message from a specific session.
 * @param {string} sessionId - The session ID.
 * @param {string} to - The recipient's phone number.
 * @param {string} message - The message to send.
 */
const sendMessage = async (sessionId, to, message) => {
    let session = sessions.get(sessionId);
    if (!session || session.status !== 'Connected') {
        const sessionDataPath = `${SESSIONS_DIR}/session-${sessionId}`;
        if (!fs.existsSync(sessionDataPath)) {
            throw new Error(`Session ${sessionId} is not connected. Please scan the QR code first using GET /api/connect/image.`);
        }
        const sessionState = await waitForSession(sessionId, 15000);
        session = sessions.get(sessionId);
        if (!session || sessionState.status !== 'Connected') {
            throw new Error(`Session ${sessionId} is not connected. Please scan the QR code first using GET /api/connect/image.`);
        }
    }
    // Validate anti-spam restrictions (rate limits, delays, daily quotas)
    await validateAntiSpam(sessionId);

    touchSessionActivity(sessionId);
    const chatId = await getFormattedChatId(session.client, to);
    await session.client.sendMessage(chatId, message, { sendSeen: false });
    console.log(`Message sent to ${to} (${chatId}) from session ${sessionId}`);
};

/**
 * Sends an attachment from a specific session.
 * @param {string} sessionId - The session ID.
 * @param {string} to - The recipient's phone number.
 * @param {string} file - URL to the file, local file path, or Base64 string.
 * @param {string} caption - The caption for the attachment.
 * @param {string} [type] - The MIME type, required for Base64 encoded files.
 */
const sendAttachment = async (sessionId, to, file, caption, type) => {
    let session = sessions.get(sessionId);
    if (!session || session.status !== 'Connected') {
        const sessionDataPath = `${SESSIONS_DIR}/session-${sessionId}`;
        if (!fs.existsSync(sessionDataPath)) {
            throw new Error(`Session ${sessionId} is not connected. Please scan the QR code first using GET /api/connect/image.`);
        }
        const sessionState = await waitForSession(sessionId, 15000);
        session = sessions.get(sessionId);
        if (!session || sessionState.status !== 'Connected') {
            throw new Error(`Session ${sessionId} is not connected. Please scan the QR code first using GET /api/connect/image.`);
        }
    }
    // Validate anti-spam restrictions (rate limits, delays, daily quotas)
    await validateAntiSpam(sessionId);

    touchSessionActivity(sessionId);

    let media;
    if (fs.existsSync(file)) {
        // Send from a local file path
        media = MessageMedia.fromFilePath(file);
    } else if (file.startsWith('http')) {
        // Send from a URL
        media = await MessageMedia.fromUrl(file, { unsafeMime: true });
    } else {
        // Send from a Base64 string
        if (!type) {
            throw new Error('The "type" parameter is required for Base64 attachments.');
        }
        const base64Data = file.includes(',') ? file.split(',')[1] : file;
        media = new MessageMedia(type, base64Data, 'file');
    }

    const chatId = await getFormattedChatId(session.client, to);
    await session.client.sendMessage(chatId, media, { caption, sendSeen: false });
    console.log(`Attachment sent to ${to} (${chatId}) from session ${sessionId}`);
};

/**
 * Waits for a session to finish initializing (e.g. until QR code is generated or session connects).
 * @param {string} sessionId - The session ID.
 * @param {number} [timeoutMs=30000] - Max wait time in ms.
 * @returns {Promise<{status: string, qrCode?: string, id: string}>}
 */
const waitForSession = (sessionId, timeoutMs = 30000) => {
    return new Promise((resolve) => {
        initializeClient(sessionId);
        const current = getStatus(sessionId);
        if (current.status !== 'Initializing') {
            return resolve(current);
        }

        const startTime = Date.now();
        const interval = setInterval(() => {
            const status = getStatus(sessionId);
            if (status.status !== 'Initializing' || (Date.now() - startTime) >= timeoutMs) {
                clearInterval(interval);
                resolve(status);
            }
        }, 500);
    });
};

/**
 * Destroys a single session and removes its stored data.
 * @param {string} sessionId
 */
const destroySession = async (sessionId) => {
    let session = sessions.get(sessionId);
    const sessionDataPath = `${SESSIONS_DIR}/session-${sessionId}`;

    // If session exists on disk but not in memory, initialize it briefly to perform logout
    if (!session && fs.existsSync(sessionDataPath)) {
        session = initializeClient(sessionId);
        await waitForSession(sessionId, 10000);
    }

    if (session) {
        sessions.delete(sessionId);
        if (session.client) {
            try {
                console.log(`Unlinking WhatsApp device session: ${sessionId}...`);
                await session.client.logout();
                console.log(`WhatsApp device session ${sessionId} unlinked successfully.`);
            } catch (err) {
                console.error(`Error unlinking WhatsApp session ${sessionId}:`, err.message);
            }
            try {
                await session.client.destroy();
            } catch (err) {
                // Ignore destroy errors
            }
        }
    }

    // Wait for Puppeteer process to fully release file locks
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
        if (fs.existsSync(sessionDataPath)) {
            fs.rmSync(sessionDataPath, { recursive: true, force: true });
        }
    } catch (err) {
        console.error(`Error removing session folder ${sessionId}:`, err);
    }
};

/**
 * Destroys all active WhatsApp sessions and clears the sessions directory.
 */
const destroyAllSessions = async () => {
    // Scan disk for offline sessions so we can unlink them as well
    if (fs.existsSync(SESSIONS_DIR)) {
        const entries = fs.readdirSync(SESSIONS_DIR);
        for (const entry of entries) {
            if (entry.startsWith('session-')) {
                const sessionId = entry.replace('session-', '');
                if (!sessions.has(sessionId)) {
                    initializeClient(sessionId);
                }
            }
        }
    }

    const activeSessions = Array.from(sessions.values());
    sessions.clear();

    for (const session of activeSessions) {
        if (session.client) {
            try {
                console.log(`Unlinking WhatsApp device session: ${session.id}...`);
                await session.client.logout();
                console.log(`WhatsApp device session ${session.id} unlinked successfully.`);
            } catch (err) {
                console.error(`Error unlinking WhatsApp session ${session.id}:`, err.message);
            }
            try {
                await session.client.destroy();
            } catch (err) {
                // Ignore destroy errors
            }
        }
    }

    // Wait for Chromium processes to shut down and release file handles
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
        if (fs.existsSync(SESSIONS_DIR)) {
            fs.rmSync(SESSIONS_DIR, { recursive: true, force: true });
            fs.mkdirSync(SESSIONS_DIR, { recursive: true });
        }
    } catch (err) {
        console.error('Error cleaning up sessions directory:', err);
    }
};

/**
 * Updates last activity timestamp for a session.
 * @param {string} sessionId
 */
const touchSessionActivity = (sessionId) => {
    const now = Date.now();
    const session = sessions.get(sessionId);
    if (session) {
        session.lastActivity = now;
    }
    const sessionDataPath = `${SESSIONS_DIR}/session-${sessionId}`;
    if (fs.existsSync(sessionDataPath)) {
        try {
            fs.writeFileSync(`${sessionDataPath}/meta.json`, JSON.stringify({ lastActivity: now }), 'utf8');
        } catch (err) {}
    }
};

/**
 * Gets last activity timestamp for a session.
 * @param {string} sessionId
 * @returns {number}
 */
const getSessionLastActivity = (sessionId) => {
    const session = sessions.get(sessionId);
    if (session && session.lastActivity) {
        return session.lastActivity;
    }
    const metaPath = `${SESSIONS_DIR}/session-${sessionId}/meta.json`;
    if (fs.existsSync(metaPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (data && data.lastActivity) return data.lastActivity;
        } catch (err) {}
    }
    const sessionDataPath = `${SESSIONS_DIR}/session-${sessionId}`;
    if (fs.existsSync(sessionDataPath)) {
        try {
            const stats = fs.statSync(sessionDataPath);
            return stats.mtimeMs;
        } catch (err) {}
    }
    return Date.now();
};

/**
 * Cleans up sessions that have been inactive for more than maxInactiveDays.
 * @param {number} maxInactiveDays - Number of inactive days threshold.
 * @returns {Promise<{cleanedCount: number, cleanedSessions: string[], thresholdDays: number}>}
 */
const cleanInactiveSessions = async (maxInactiveDays) => {
    const days = parseFloat(maxInactiveDays) || 7;
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const allSessionIds = new Set();

    // Collect active sessions in memory
    for (const id of sessions.keys()) {
        allSessionIds.add(id);
    }

    // Collect session folders from disk
    if (fs.existsSync(SESSIONS_DIR)) {
        const entries = fs.readdirSync(SESSIONS_DIR);
        for (const entry of entries) {
            if (entry.startsWith('session-')) {
                allSessionIds.add(entry.replace('session-', ''));
            }
        }
    }

    const cleanedSessions = [];
    for (const sessionId of allSessionIds) {
        const lastActivity = getSessionLastActivity(sessionId);
        if (lastActivity < cutoffTime) {
            console.log(`Cleaning inactive session ${sessionId} (last active: ${new Date(lastActivity).toISOString()})`);
            await destroySession(sessionId);
            cleanedSessions.push(sessionId);
        }
    }

    return {
        cleanedCount: cleanedSessions.length,
        cleanedSessions,
        thresholdDays: days
    };
};

module.exports = {
    initializeClient,
    getStatus,
    waitForSession,
    destroySession,
    destroyAllSessions,
    cleanInactiveSessions,
    touchSessionActivity,
    sendMessage,
    sendAttachment
};