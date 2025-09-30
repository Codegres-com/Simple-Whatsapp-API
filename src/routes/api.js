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
 *     description: Establishes a new WhatsApp session and returns the QR code as a string for authentication.
 *     responses:
 *       200:
 *         description: QR code string.
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
 *     description: Establishes a new WhatsApp session and returns the QR code as a PNG image.
 *     responses:
 *       200:
 *         description: QR code image.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
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
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *       400:
 *         description: Bad request.
 */
router.post('/send-message', sendTextMessage);

/**
 * @swagger
 * /api/send-attachment:
 *   post:
 *     summary: Send a message with an attachment
 *     tags: [Messaging]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *               caption:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Attachment sent successfully.
 *       400:
 *         description: Bad request.
 */
router.post('/send-attachment', upload.single('file'), sendAttachmentMessage);

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [File Upload]
 *     security:
 *       - ApiKeyAuth: []
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
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
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
 *         required: true
 *         description: The message content.
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *       400:
 *         description: Bad request.
 */
router.get('/send', sendFromApi);

module.exports = router;