const express = require('express');
const router = express.Router();

// Import controllers
const { getQrCodeString, getQrCodeImage } = require('../controllers/authController');
const { sendTextMessage, sendAttachmentMessage, sendFromApi } = require('../controllers/messageController');
const { uploadFile } = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: API endpoints for authentication and session management
 *   - name: Messaging
 *     description: API endpoints for sending messages
 *   - name: File Upload
 *     description: API endpoints for file uploads
 */

/**
 * @swagger
 * /api/connect:
 *   get:
 *     summary: Get QR code as a string
 *     tags: [Authentication]
 *     description: Establishes a new WhatsApp session and returns the QR code as a string for authentication. Requires a session key.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: Your unique session key.
 *     responses:
 *       200:
 *         description: QR code string or session status.
 *       400:
 *         description: Missing X-API-KEY header.
 *       500:
 *         description: Server error.
 */
router.get('/connect', getQrCodeString);

/**
 * @swagger
 * /api/connect/image:
 *   get:
 *     summary: Get QR code as an image
 *     tags: [Authentication]
 *     description: Establishes a new WhatsApp session and returns the QR code as a PNG image. Requires a session key.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: Your unique session key.
 *     responses:
 *       200:
 *         description: QR code image.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing X-API-KEY header.
 *       404:
 *         description: QR code not available.
 *       500:
 *         description: Server error.
 */
router.get('/connect/image', getQrCodeImage);

/**
 * @swagger
 * /api/send-message:
 *   post:
 *     summary: Send a text message
 *     tags: [Messaging]
 *     description: Sends a text message from a specific session. The session is identified by the `X-API-KEY`, which can be passed either in the request header or in the request body. The header takes precedence.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: false
 *         description: Your unique session key (can be in header or body).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               X-API-KEY:
 *                 type: string
 *                 description: Your unique session key (if not provided in header).
 *               to:
 *                 type: string
 *                 description: The recipient's phone number.
 *               message:
 *                 type: string
 *                 description: The text message to send.
 *             required:
 *               - to
 *               - message
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *       400:
 *         description: Bad request (e.g., missing parameters or session key).
 */
router.post('/send-message', sendTextMessage);

/**
 * @swagger
 * /api/send-attachment:
 *   post:
 *     summary: Send a message with an attachment
 *     tags: [Messaging]
 *     description: Sends a file attachment from a specific session. The session is identified by the `X-API-KEY`, which can be passed either in the request header or in the request body. The header takes precedence. This endpoint supports `multipart/form-data` for direct uploads and `application/json` for sending from a URL or Base64 string.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: false
 *         description: Your unique session key (can be in header or body).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               X-API-KEY:
 *                 type: string
 *                 description: Your unique session key (if not provided in header).
 *               to:
 *                 type: string
 *               caption:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *             required:
 *                - to
 *                - file
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               X-API-KEY:
 *                 type: string
 *                 description: Your unique session key (if not provided in header).
 *               to:
 *                 type: string
 *               file:
 *                 type: string
 *                 description: A public URL to the file or a Base64 encoded string.
 *               type:
 *                 type: string
 *                 description: The MIME type of the file (required for Base64).
 *               caption:
 *                 type: string
 *             required:
 *               - to
 *               - file
 *     responses:
 *       200:
 *         description: Attachment sent successfully.
 *       400:
 *         description: Bad request (e.g., missing parameters or session key).
 */
router.post('/send-attachment', upload.single('file'), sendAttachmentMessage);

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [File Upload]
 *     description: Uploads a file to the server and returns a temporary URL. This endpoint does not require a session key (`X-API-KEY`).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully.
 *       400:
 *         description: No file uploaded.
 */
router.post('/upload', upload.single('file'), uploadFile);

/**
 * @swagger
 * /api/send:
 *   get:
 *     summary: Send a message via GET request
 *     tags: [Messaging]
 *     description: A simple GET request to send a text message or an attachment via URL. Requires a session key.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: Your unique session key.
 *       - in: query
 *         name: number
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipient's phone number.
 *       - in: query
 *         name: message
 *         schema:
 *           type: string
 *         required: false
 *         description: The text message to send (used as caption if `attachmentUrl` is present).
 *       - in: query
 *         name: attachmentUrl
 *         schema:
 *           type: string
 *         required: false
 *         description: A URL to a file to send as an attachment.
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *       400:
 *         description: Bad request (e.g., missing parameters or session key).
 */
router.get('/send', sendFromApi);

module.exports = router;