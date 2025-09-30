const qrcode = require('qrcode');
const { getStatus } = require('../services/whatsapp');

/**
 * Handles the /connect endpoint.
 * Returns the QR code string if available, otherwise the current status.
 */
const getQrCodeString = (req, res) => {
    const { status, qrCode } = getStatus();
    if (status === 'QR Code Generated' && qrCode) {
        res.status(200).send(qrCode);
    } else {
        res.status(200).json({ status });
    }
};

/**
 * Handles the /connect/image endpoint.
 * Returns the QR code as a PNG image.
 */
const getQrCodeImage = (req, res) => {
    const { status, qrCode } = getStatus();
    if (status === 'QR Code Generated' && qrCode) {
        qrcode.toBuffer(qrCode, (err, buffer) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate QR code image.' });
            }
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        });
    } else {
        res.status(404).json({ error: 'QR code not available.', status });
    }
};

module.exports = {
    getQrCodeString,
    getQrCodeImage
};