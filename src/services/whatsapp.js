const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');

// Store client and session data
let client;
let qrCodeData;
let status = 'Initializing';

/**
 * Initializes the WhatsApp client and sets up event listeners.
 */
const initializeClient = () => {
    console.log('Initializing WhatsApp client...');
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: 'sessions' }), // Using LocalAuth for session persistence
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('QR code received, generating...');
        qrCodeData = qr;
        status = 'QR Code Generated';
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Error generating QR code image', err);
                return;
            }
            // Optional: log the data URL for debugging
            // console.log('QR code as data URL:', url);
        });
    });

    client.on('ready', () => {
        console.log('WhatsApp client is ready!');
        qrCodeData = null;
        status = 'Connected';
    });

    client.on('authenticated', () => {
        console.log('Authentication successful.');
        status = 'Connected';
    });

    client.on('auth_failure', (msg) => {
        console.error('Authentication failure:', msg);
        status = 'Authentication Failure';
        // Here you might want to clear the session data and restart
    });

    client.on('disconnected', (reason) => {
        console.log('Client was logged out:', reason);
        status = 'Disconnected';
        // Destroy and re-initialize the client to get a new QR code
        client.destroy();
        initializeClient();
    });

    client.initialize();
};

/**
 * Returns the current status of the WhatsApp client.
 * @returns {{status: string, qrCode?: string}}
 */
const getStatus = () => {
    return { status, qrCode: qrCodeData };
};

/**
 * Sends a text message to a specified number.
 * @param {string} to - The recipient's phone number.
 * @param {string} message - The message to send.
 * @returns {Promise<void>}
 */
const sendMessage = async (to, message) => {
    if (status !== 'Connected') {
        throw new Error('WhatsApp client is not connected.');
    }
    const chatId = `${to.replace('+', '')}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`Message sent to ${to}`);
};

/**
 * Sends an attachment to a specified number.
 * @param {string} to - The recipient's phone number.
 * @param {string} file - Base64 encoded file or URL.
 * @param {string} caption - The caption for the attachment.
 * @param {string} type - The type of attachment (image, video, document).
 * @returns {Promise<void>}
 */
const sendAttachment = async (to, file, caption, type) => {
    if (status !== 'Connected') {
        throw new Error('WhatsApp client is not connected.');
    }

    let media;
    // Check if the file is a URL or a Base64 string
    if (file.startsWith('http')) {
        media = await MessageMedia.fromUrl(file, { unsafeMime: true });
    } else {
        // Handle Base64 strings, including Data URLs
        const base64Data = file.includes(',') ? file.split(',')[1] : file;
        media = new MessageMedia(type, base64Data, 'file');
    }

    const chatId = `${to.replace('+', '')}@c.us`;
    await client.sendMessage(chatId, media, { caption });
    console.log(`Attachment sent to ${to}`);
};


module.exports = {
    initializeClient,
    getStatus,
    sendMessage,
    sendAttachment
};