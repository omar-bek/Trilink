import mongoose from 'mongoose';
import { Role } from '../../src/config/rbac';
import { IUser } from '../../src/modules/users/schema';

export const createTestUser = (overrides: Partial<IUser> = {}): Partial<IUser> => {
  return {
    _id: new mongoose.Types.ObjectId(),
    email: overrides.email || 'test@example.com',
    password: overrides.password || '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJYz5K5qK', // Password123!
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    role: overrides.role || Role.BUYER,
    companyId: overrides.companyId || new mongoose.Types.ObjectId(),
    status: overrides.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createAdminUser = (companyId?: mongoose.Types.ObjectId): Partial<IUser> => {
  return createTestUser({
    email: 'admin@trilink.ae',
    role: Role.ADMIN,
    companyId: companyId || new mongoose.Types.ObjectId(),
  });
};

export const createBuyerUser = (companyId?: mongoose.Types.ObjectId): Partial<IUser> => {
  return createTestUser({
    email: 'buyer@uae.gov.ae',
    role: Role.BUYER,
    companyId: companyId || new mongoose.Types.ObjectId(),
  });
};

export const createSupplierUser = (companyId?: mongoose.Types.ObjectId): Partial<IUser> => {
  return createTestUser({
    email: 'supplier@techsupplies.ae',
    role: Role.SUPPLIER,
    companyId: companyId || new mongoose.Types.ObjectId(),
  });
};
