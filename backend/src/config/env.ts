import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable schema validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  MONGODB_URI: z.string().url().min(1),
  CORS_ORIGIN: z.string().url().optional().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  JWT_SECRET: z.string().min(32).default('test-jwt-secret-min-32-chars-for-testing-only'),
  JWT_REFRESH_SECRET: z.string().min(32).default('test-jwt-refresh-secret-min-32-chars-for-testing'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/).transform(Number).default('12'),
  // Redis Configuration (optional for development)
  REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
  // Socket.io Connection Limits
  SOCKET_MAX_CONNECTIONS_PER_USER: z.string().regex(/^\d+$/).transform(Number).optional().default('5'),
  SOCKET_MAX_CONNECTIONS_PER_COMPANY: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
  SOCKET_MAX_CONNECTIONS_PER_IP: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  // AWS S3 Configuration (optional for development)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  // Payment Gateway Configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'production']).optional().default('sandbox'),
  PAYPAL_WEBHOOK_SECRET: z.string().optional(),
  // AI Configuration
  AI_ENABLED: z.string().transform((val) => val === 'true').optional().default('true'),
});

/**
 * Validate and parse environment variables
 */
const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Validated environment configuration
 */
export const env = parseEnv();

/**
 * Type-safe environment configuration export
 */
export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  mongodb: {
    uri: env.MONGODB_URI,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  jwt: {
    // Secrets loaded from SecretsManagerService at runtime
    get secret(): string {
      const { getSecretsManager } = require('../utils/secrets-manager.service');
      try {
        return getSecretsManager().getSecrets().jwtSecret;
      } catch {
        // Fallback to env for backward compatibility during migration
        return env.JWT_SECRET;
      }
    },
    get refreshSecret(): string {
      const { getSecretsManager } = require('../utils/secrets-manager.service');
      try {
        return getSecretsManager().getSecrets().jwtRefreshSecret;
      } catch {
        // Fallback to env for backward compatibility during migration
        return env.JWT_REFRESH_SECRET;
      }
    },
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3Bucket: env.AWS_S3_BUCKET,
  },
  email: {
    from: process.env.EMAIL_FROM,
    fromName: process.env.EMAIL_FROM_NAME || 'TriLink Platform',
    sendGridApiKey: process.env.SENDGRID_API_KEY,
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
  redis: {
    url: env.REDIS_URL || 'redis://localhost:6379',
  },
  socket: {
    maxConnectionsPerUser: env.SOCKET_MAX_CONNECTIONS_PER_USER,
    maxConnectionsPerCompany: env.SOCKET_MAX_CONNECTIONS_PER_COMPANY,
    maxConnectionsPerIP: env.SOCKET_MAX_CONNECTIONS_PER_IP,
  },
  payment: {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    paypal: {
      clientId: env.PAYPAL_CLIENT_ID,
      clientSecret: env.PAYPAL_CLIENT_SECRET,
      environment: env.PAYPAL_ENVIRONMENT,
      webhookSecret: env.PAYPAL_WEBHOOK_SECRET,
    },
  },
  ai: {
    enabled: env.AI_ENABLED,
  },
} as const;
