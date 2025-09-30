const express = require('express');
const router = express.Router();

// Import controllers
const { getQrCodeString, getQrCodeImage } = require('../controllers/authController');
const { sendTextMessage, sendAttachmentMessage } = require('../controllers/messageController');

// Import middleware
const apiKeyAuth = require('../middleware/authMiddleware');

// Public routes for connection and QR code
router.get('/connect', getQrCodeString);
router.get('/connect/image', getQrCodeImage);

// Protected routes for sending messages
router.post('/send-message', apiKeyAuth, sendTextMessage);
router.post('/send-attachment', apiKeyAuth, sendAttachmentMessage);

module.exports = router;