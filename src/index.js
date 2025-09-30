require('dotenv').config();
const express = require('express');
const apiRoutes = require('./routes/api');
const { initializeClient } = require('./services/whatsapp');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' })); // Increase limit for Base64 files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Use API routes
app.use('/api', apiRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.send('WhatsApp API Server is running. Use the /api endpoints to interact.');
});

// Start the WhatsApp client initialization
initializeClient();

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});