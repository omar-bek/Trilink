// @ts-ignore - dataloader types may not be available
import DataLoader from 'dataloader';
import { IUser } from '../modules/users/schema';
import { ICompany } from '../modules/companies/schema';
import { User } from '../modules/users/schema';
import { Company } from '../modules/companies/schema';
import mongoose from 'mongoose';

/**
 * DataLoader utility for batch loading and caching database queries
 * Prevents N+1 query problems by batching and caching requests
 */

/**
 * Batch load users by IDs
 */
const batchLoadUsers = async (
  userIds: readonly string[]
): Promise<(IUser | null)[]> => {
  const ids = userIds.map((id) => new mongoose.Types.ObjectId(id));
  const users = await User.find({
    _id: { $in: ids },
    deletedAt: null,
  });

  // Create a map for O(1) lookup
  const userMap = new Map<string, IUser>();
  users.forEach((user) => {
    userMap.set(user._id.toString(), user);
  });

  // Return users in the same order as requested IDs
  return userIds.map((id) => userMap.get(id) || null);
};

/**
 * Batch load companies by IDs
 */
const batchLoadCompanies = async (
  companyIds: readonly string[]
): Promise<(ICompany | null)[]> => {
  const ids = companyIds.map((id) => new mongoose.Types.ObjectId(id));
  const companies = await Company.find({
    _id: { $in: ids },
    deletedAt: null,
  });

  // Create a map for O(1) lookup
  const companyMap = new Map<string, ICompany>();
  companies.forEach((company) => {
    companyMap.set(company._id.toString(), company);
  });

  // Return companies in the same order as requested IDs
  return companyIds.map((id) => companyMap.get(id) || null);
};

/**
 * Create a new DataLoader instance for users
 * Uses cache per request (cleared after each request)
 */
export const createUserLoader = (): DataLoader<string, IUser | null> => {
  return new DataLoader<string, IUser | null>(batchLoadUsers, {
    // Cache for the duration of the request
    cache: true,
    // Batch requests within 10ms window
    batchScheduleFn: (callback) => setTimeout(callback, 10),
  });
};

/**
 * Create a new DataLoader instance for companies
 * Uses cache per request (cleared after each request)
 */
export const createCompanyLoader = (): DataLoader<string, ICompany | null> => {
  return new DataLoader<string, ICompany | null>(batchLoadCompanies, {
    // Cache for the duration of the request
    cache: true,
    // Batch requests within 10ms window
    batchScheduleFn: (callback) => setTimeout(callback, 10),
  });
};

/**
 * Batch load users by IDs (direct function, no caching)
 * Use this when you need batch loading but don't need caching
 */
export const batchLoadUsersByIds = async (
  userIds: string[]
): Promise<Map<string, IUser>> => {
  if (userIds.length === 0) {
    return new Map();
  }

  const ids = userIds.map((id) => new mongoose.Types.ObjectId(id));
  const users = await User.find({
    _id: { $in: ids },
    deletedAt: null,
  });

  const userMap = new Map<string, IUser>();
  users.forEach((user) => {
    userMap.set(user._id.toString(), user);
  });

  return userMap;
};

/**
 * Batch load companies by IDs (direct function, no caching)
 * Use this when you need batch loading but don't need caching
 */
export const batchLoadCompaniesByIds = async (
  companyIds: string[]
): Promise<Map<string, ICompany>> => {
  if (companyIds.length === 0) {
    return new Map();
  }

  const ids = companyIds.map((id) => new mongoose.Types.ObjectId(id));
  const companies = await Company.find({
    _id: { $in: ids },
    deletedAt: null,
  });

  const companyMap = new Map<string, ICompany>();
  companies.forEach((company) => {
    companyMap.set(company._id.toString(), company);
  });

  return companyMap;
};
