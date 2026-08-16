require('dotenv').config();
const swaggerJSDoc = require('swagger-jsdoc');

const title = process.env.SWAGGER_TITLE || process.env.APP_TITLE || 'Mk WhatsApp API';
const baseDescription = process.env.SWAGGER_DESCRIPTION || process.env.APP_DESCRIPTION || 'Gateway REST para mensajería y automatización de WhatsApp.';
const description = `${baseDescription}`;

const serverUrl = process.env.SERVER_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
const serverDescription = process.env.SERVER_DESCRIPTION || 'API Server';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: title,
    version: '1.0.0',
    description: description,
  },
  servers: [
    {
      url: serverUrl,
      description: serverDescription,
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-MASTER-KEY',
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
