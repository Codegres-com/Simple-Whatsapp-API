require('dotenv').config();
const express = require('express');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' })); // Increase limit for Base64 files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

const masterApiKeyAuth = require('./middleware/masterAuthMiddleware');

// Use API routes
app.use('/api', masterApiKeyAuth);
app.use('/api', apiRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.send('WhatsApp API Server is running. Use the /api endpoints to interact.');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});