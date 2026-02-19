# Swagger UI Integration Guide

This document explains how to use the Swagger UI integration for the TriLink Platform API.

## Overview

The API documentation is automatically generated from the OpenAPI 3.0 specification file (`openapi.yaml`) and served via Swagger UI.

## Installation

Install the required dependencies:

```bash
npm install
```

The following packages are required:
- `swagger-ui-express`: Serves the Swagger UI interface
- `yamljs`: Parses the OpenAPI YAML specification

## Accessing Swagger UI

### Development Mode

Swagger UI is automatically enabled in development mode. Start the server:

```bash
npm run dev
```

Then access Swagger UI at:
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json
- **OpenAPI YAML**: http://localhost:3000/api-docs.yaml

### Production Mode

By default, Swagger UI is disabled in production for security reasons. To enable it, set the environment variable:

```bash
ENABLE_SWAGGER=true npm start
```

## Features

### Interactive API Testing

Swagger UI provides an interactive interface where you can:
- Browse all available endpoints
- View request/response schemas
- Test endpoints directly from the browser
- See authentication requirements
- View example requests and responses

### Authentication

To test authenticated endpoints:

1. First, authenticate using `/api/auth/login` to get an access token
2. Click the "Authorize" button at the top of the Swagger UI
3. Enter your token in the format: `Bearer <your-access-token>`
4. Click "Authorize" and "Close"
5. The token will be persisted across page refreshes (if `persistAuthorization` is enabled)

### Example Workflow

1. **Register/Login**: Use `/api/auth/register` or `/api/auth/login` to get tokens
2. **Authorize**: Click "Authorize" and enter your Bearer token
3. **Test Endpoints**: Try any endpoint by clicking "Try it out", filling in parameters, and clicking "Execute"
4. **View Responses**: See the actual response from your API

## OpenAPI Specification

The complete OpenAPI 3.0 specification is defined in `openapi.yaml` and includes:

- All REST endpoints with HTTP methods
- Request/response schemas
- Authentication requirements
- Role-based access control information
- Example requests and responses
- Error response formats

## Updating the Specification

To update the API documentation:

1. Edit `openapi.yaml` with your changes
2. Restart the server (or it will auto-reload in dev mode)
3. Refresh the Swagger UI page

## Customization

Swagger UI options can be customized in `src/config/swagger.ts`:

- `customCss`: Custom styling
- `customSiteTitle`: Page title
- `swaggerOptions`: Various Swagger UI settings
  - `persistAuthorization`: Keep auth token across refreshes
  - `displayRequestDuration`: Show request timing
  - `filter`: Enable endpoint filtering
  - `tryItOutEnabled`: Enable "Try it out" by default

## Security Considerations

- Swagger UI is disabled by default in production
- Never expose Swagger UI in production without proper authentication
- Consider adding IP whitelisting or authentication middleware for Swagger routes in production
- The OpenAPI spec does not expose sensitive information like database schemas or internal implementation details

## Troubleshooting

### Swagger UI not loading

- Ensure dependencies are installed: `npm install`
- Check that `openapi.yaml` exists in the backend root directory
- Verify the server is running in development mode or `ENABLE_SWAGGER=true` is set
- Check server logs for any errors

### Authentication not working

- Ensure you're using the correct token format: `Bearer <token>`
- Verify the token hasn't expired
- Check that the endpoint requires authentication (some endpoints are public)

### Schema validation errors

- Verify your request body matches the schema defined in `openapi.yaml`
- Check that required fields are provided
- Ensure data types match (e.g., strings vs numbers)

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Express.js Documentation](https://expressjs.com/)
