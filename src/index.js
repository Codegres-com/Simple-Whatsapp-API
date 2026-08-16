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

const path = require('path');

// Serve static files from the 'uploads' and 'public' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de autenticación para la documentación técnica
const docsAuthMiddleware = (req, res, next) => {
  const requiredPass = process.env.DOCS_PASSWORD || 'Chimpanzee24.gt';
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic realm="Documentacion Restringida"');
    return res.status(401).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Acceso Restringido - Documentación</title>
        <style>
          body { background: #0B0F19; color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #111827; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 14px; padding: 36px; max-width: 440px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
          h2 { color: #EF4444; margin-bottom: 12px; font-size: 1.4rem; }
          p { color: #94A3B8; font-size: 0.95rem; line-height: 1.6; }
          a { color: #25D366; text-decoration: none; font-weight: 600; margin-top: 20px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🔒 Autenticación Requerida</h2>
          <p>Debes ingresar las credenciales autorizadas para consultar la documentación técnica de la API.</p>
          <a href="/">← Volver al inicio</a>
        </div>
      </body>
      </html>
    `);
  }

  const auth = Buffer.from(authHeader.split(' ')[1] || '', 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth.slice(1).join(':');

  if (pass === requiredPass || user === requiredPass) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Documentacion Restringida"');
  return res.status(401).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Error de Autenticación</title>
      <style>
        body { background: #0B0F19; color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #111827; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 14px; padding: 36px; max-width: 440px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        h2 { color: #EF4444; margin-bottom: 12px; font-size: 1.4rem; }
        p { color: #CBD5E1; font-size: 0.95rem; line-height: 1.6; }
        .err-badge { background: rgba(239, 68, 68, 0.15); border: 1px solid #EF4444; color: #FCA5A5; padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; margin: 16px 0; }
        a { color: #38BDF8; text-decoration: none; font-weight: 600; margin-top: 16px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>❌ Acceso Denegado</h2>
        <div class="err-badge">Error: Contraseña incorrecta</div>
        <p>La contraseña ingresada no es válida para visualizar la documentación técnica.</p>
        <a href="/">← Volver al inicio</a>
      </div>
    </body>
    </html>
  `);
};

// UI Docs setup (Protegido por contraseña)
const swaggerUiOptions = {
  customSiteTitle: process.env.APP_TITLE || 'WhatsApp API Documentation',
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
    validatorUrl: null,
    defaultModelsExpandDepth: -1,
    persistAuthorization: true,
  },
};
app.use('/api-docs', docsAuthMiddleware, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

const masterApiKeyAuth = require('./middleware/masterAuthMiddleware');

// Use API routes
app.use('/api', masterApiKeyAuth);
app.use('/api', apiRoutes);

// Welcome route - Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
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
    console.log(`API docs available at http://localhost:${port}/api-docs (Protected)`);
});