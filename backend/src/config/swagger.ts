import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const YAML = require('yamljs');

/**
 * Swagger UI configuration for Express.js
 */
export const setupSwagger = (app: Express): void => {
  try {
    // Load OpenAPI specification from YAML file
    const swaggerFilePath = path.join(__dirname, '../../openapi.yaml');
    const swaggerDocument = YAML.load(swaggerFilePath);

    // Swagger UI options
    const swaggerOptions = {
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #3b82f6; }
      `,
      customSiteTitle: 'TriLink Platform API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true, // Persist authorization token across page refreshes
        displayRequestDuration: true,
        filter: true, // Enable filtering
        tryItOutEnabled: true, // Enable "Try it out" by default
      },
    };

    // Serve Swagger UI at /api-docs
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

    // Serve OpenAPI spec as JSON at /api-docs.json
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerDocument);
    });

    // Serve OpenAPI spec as YAML at /api-docs.yaml
    app.get('/api-docs.yaml', (req, res) => {
      const yamlContent = fs.readFileSync(swaggerFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/yaml');
      res.send(yamlContent);
    });

    console.log('📚 Swagger UI available at /api-docs');
    console.log('📄 OpenAPI spec available at /api-docs.json and /api-docs.yaml');
  } catch (error) {
    console.error('❌ Error setting up Swagger UI:', error);
    // Don't throw error - allow app to continue without Swagger
  }
};
