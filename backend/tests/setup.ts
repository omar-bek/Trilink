import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { config } from '../src/config/env';

let mongoServer: MongoMemoryServer;

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-chars-for-testing';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/trilink-test';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.LOG_LEVEL = 'error';

  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Override MongoDB URI for tests
  process.env.MONGODB_URI = mongoUri;

  // Connect to in-memory database
  await mongoose.connect(mongoUri);
});

/**
 * Clean up after each test
 */
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

/**
 * Global test teardown - runs once after all tests
 */
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
  }
});
