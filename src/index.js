require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for local requests
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' })); // Increase limit for Base64 files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Swagger UI setup
const swaggerUiOptions = {
  customSiteTitle: process.env.SWAGGER_TITLE || process.env.APP_TITLE || 'Simple WhatsApp API',
  customJsStr: `
    window.addEventListener('load', function() {
      setTimeout(function() {
        const key = '${process.env.MASTER_API_KEY || "SUPER_SECRET_KEY"}';
        const ui = window.ui;
        if (ui) {
          ui.preauthorizeApiKey("ApiKeyAuth", key);
        }
      }, 300);
    });
  `,
  swaggerOptions: {
    // The validatorUrl is set to null to disable the validation of the OpenAPI specification.
    validatorUrl: null,
    // The defaultModelsExpandDepth option is set to -1 to hide the "Models" section in the Swagger UI.
    defaultModelsExpandDepth: -1,
    persistAuthorization: true,
  },
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

const masterApiKeyAuth = require('./middleware/masterAuthMiddleware');

// Use API routes
app.use('/api', masterApiKeyAuth);
app.use('/api', apiRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.send('WhatsApp API Server is running. Use the /api endpoints to interact.');
});

// Process error handlers to prevent crashes on browser disconnects
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection (caught):', reason && reason.message ? reason.message : reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception (caught):', err && err.message ? err.message : err);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});