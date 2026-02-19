import mongoose from 'mongoose';
import { config } from './env';

/**
 * MongoDB connection options
 * CRITICAL FIX: Increased pool size for government-scale deployment
 * Previous: 10 (insufficient for 500+ concurrent requests)
 * Current: 100 (supports 500+ concurrent requests with buffer)
 */
const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: 100,        // 10x increase for government scale (was 10)
  minPoolSize: 20,         // Keep warm connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,    // Close idle connections after 30s
  connectTimeoutMS: 10000, // Connection timeout
  retryWrites: true,       // Retry failed writes
  retryReads: true,        // Retry failed reads
};

/**
 * Connect to MongoDB database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, mongooseOptions);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
