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
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        // Clean up and remove the failed session
        fs.rmdirSync(sessionDataPath, { recursive: true });
        sessions.delete(sessionId);
    });

    client.on('disconnected', (reason) => {
        console.log(`Client for session ${sessionId} was logged out:`, reason);
        session.status = 'Disconnected';
        client.destroy().catch(err => console.error(`Error destroying client for session ${sessionId}:`, err));
        sessions.delete(sessionId);
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
        // If no session exists, initialize one.
        const newSession = initializeClient(sessionId);
        return {
            id: newSession.id,
            status: newSession.status,
            qrCode: newSession.qrCode
        };
    }
    return {
        id: session.id,
        status: session.status,
        qrCode: session.qrCode
    };
};

/**
 * Sends a text message from a specific session.
 * @param {string} sessionId - The session ID.
 * @param {string} to - The recipient's phone number.
 * @param {string} message - The message to send.
 */
const sendMessage = async (sessionId, to, message) => {
    const session = sessions.get(sessionId);
    if (!session || session.status !== 'Connected') {
        throw new Error(`Session ${sessionId} is not connected.`);
    }
    const chatId = `${to.replace('+', '')}@c.us`;
    await session.client.sendMessage(chatId, message);
    console.log(`Message sent to ${to} from session ${sessionId}`);
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
    const session = sessions.get(sessionId);
    if (!session || session.status !== 'Connected') {
        throw new Error(`Session ${sessionId} is not connected.`);
    }

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

    const chatId = `${to.replace('+', '')}@c.us`;
    await session.client.sendMessage(chatId, media, { caption });
    console.log(`Attachment sent to ${to} from session ${sessionId}`);
};

module.exports = {
    initializeClient,
    getStatus,
    sendMessage,
    sendAttachment
};