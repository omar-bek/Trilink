import { generateAccessToken, JWTPayload } from '../../src/utils/jwt';
import { Role } from '../../src/config/rbac';
import mongoose from 'mongoose';

/**
 * Generate a test JWT token for a user
 */
export const generateTestToken = (payload: Partial<JWTPayload>): string => {
  const defaultPayload: JWTPayload = {
    userId: payload.userId || new mongoose.Types.ObjectId().toString(),
    email: payload.email || 'test@example.com',
    role: payload.role || Role.BUYER,
    companyId: payload.companyId || new mongoose.Types.ObjectId().toString(),
  };

  return generateAccessToken(defaultPayload);
};

/**
 * Generate tokens for different roles
 */
export const generateAdminToken = (companyId?: string): string => {
  return generateTestToken({
    role: Role.ADMIN,
    email: 'admin@trilink.ae',
    companyId: companyId || new mongoose.Types.ObjectId().toString(),
  });
};

export const generateBuyerToken = (companyId?: string): string => {
  return generateTestToken({
    role: Role.BUYER,
    email: 'buyer@uae.gov.ae',
    companyId: companyId || new mongoose.Types.ObjectId().toString(),
  });
};

export const generateSupplierToken = (companyId?: string): string => {
  return generateTestToken({
    role: Role.SUPPLIER,
    email: 'supplier@techsupplies.ae',
    companyId: companyId || new mongoose.Types.ObjectId().toString(),
  });
};

export const generateLogisticsToken = (companyId?: string): string => {
  return generateTestToken({
    role: Role.LOGISTICS,
    email: 'logistics@fastlogistics.ae',
    companyId: companyId || new mongoose.Types.ObjectId().toString(),
  });
};

export const generateClearanceToken = (companyId?: string): string => {
  return generateTestToken({
    role: Role.CLEARANCE,
    email: 'clearance@clearance.ae',
    companyId: companyId || new mongoose.Types.ObjectId().toString(),
  });
};

export const generateGovernmentToken = (companyId?: string): string => {
  return generateTestToken({
    role: Role.GOVERNMENT,
    email: 'government@uae.gov.ae',
    companyId: companyId || new mongoose.Types.ObjectId().toString(),
  });
};

/**
 * Create authorization header
 */
export const authHeader = (token: string): { Authorization: string } => {
  return { Authorization: `Bearer ${token}` };
};
