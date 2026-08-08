const express = require('express');
const router = express.Router();

// Import controllers
const { getQrCodeString, getQrCodeImage, logout, logoutAll, cleanupInactive } = require('../controllers/authController');
const { sendTextMessage, sendAttachmentMessage, sendFromApi } = require('../controllers/messageController');
const { uploadFile, cleanupUploads } = require('../controllers/uploadController');
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
 * /api/logout:
 *   post:
 *     summary: Close specific session
 *     tags: [Authentication]
 *     description: Closes and removes a specific WhatsApp session identified by `X-API-KEY`.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: Your unique session key.
 *     responses:
 *       200:
 *         description: Session closed successfully.
 *       400:
 *         description: Missing X-API-KEY header.
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/logout-all:
 *   post:
 *     summary: Close all sessions
 *     tags: [Authentication]
 *     description: Closes all active WhatsApp sessions and deletes stored session data.
 *     responses:
 *       200:
 *         description: All sessions closed successfully.
 */
router.post('/logout-all', logoutAll);

/**
 * @swagger
 * /api/cleanup-inactive:
 *   post:
 *     summary: Clean up abandoned inactive sessions
 *     tags: [Authentication]
 *     description: Identifies and removes sessions that have not been active for a specified number of days.
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         required: false
 *         description: Number of inactive days threshold. Sessions unused for longer than this will be unlinked and deleted.
 *     responses:
 *       200:
 *         description: Cleanup completed successfully.
 */
router.post('/cleanup-inactive', cleanupInactive);

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
 * /api/upload/cleanup:
 *   post:
 *     summary: Clean up temporary uploaded files
 *     tags: [File Upload]
 *     description: Deletes temporary uploaded files in the uploads folder older than a specified number of minutes.
 *     parameters:
 *       - in: query
 *         name: minutes
 *         schema:
 *           type: number
 *           default: 5
 *         required: false
 *         description: Threshold in minutes. Uploaded files older than this will be permanently purged.
 *     responses:
 *       200:
 *         description: Upload cleanup completed successfully.
 */
router.post('/upload/cleanup', cleanupUploads);

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