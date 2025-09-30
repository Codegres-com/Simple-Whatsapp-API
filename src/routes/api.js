const express = require('express');
const router = express.Router();

// Import controllers
const { getQrCodeString, getQrCodeImage } = require('../controllers/authController');
const { sendTextMessage, sendAttachmentMessage, sendFromApi } = require('../controllers/messageController');
const { uploadFile } = require('../controllers/uploadController');

// Public routes for connection and QR code
router.get('/connect', getQrCodeString);
router.get('/connect/image', getQrCodeImage);

// Protected routes for sending messages
router.post('/send-message', sendTextMessage);
router.post('/send-attachment', sendAttachmentMessage);

// Route for file uploads
router.post('/upload', uploadFile);

// GET route for sending messages
router.get('/send', sendFromApi);

module.exports = router;