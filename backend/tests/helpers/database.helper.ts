import mongoose from 'mongoose';

/**
 * Clear all collections in the database
 */
export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Drop all collections
 */
export const dropDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
};

/**
 * Get a collection by name
 */
export const getCollection = (name: string) => {
  return mongoose.connection.collection(name);
};

/**
 * Create a test ObjectId
 */
export const createObjectId = (): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId();
};

/**
 * Convert string to ObjectId
 */
export const toObjectId = (id: string): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId(id);
};
