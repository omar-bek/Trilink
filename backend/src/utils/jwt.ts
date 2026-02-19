import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

/**
 * Generate JWT Access Token (15 minutes expiry)
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

/**
 * Generate JWT Refresh Token (7 days expiry)
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

/**
 * Verify JWT Access Token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify JWT Refresh Token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode JWT token without verification (for inspection only)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Password Reset Token Payload
 */
export interface PasswordResetPayload {
  userId: string;
  email: string;
  type: 'password-reset';
}

/**
 * Generate JWT Password Reset Token (1 hour expiry)
 */
export const generatePasswordResetToken = (userId: string, email: string): string => {
  const payload: PasswordResetPayload = {
    userId,
    email,
    type: 'password-reset',
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1h', // Password reset tokens expire in 1 hour
  });
};

/**
 * Verify JWT Password Reset Token
 */
export const verifyPasswordResetToken = (token: string): PasswordResetPayload => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as PasswordResetPayload;
    
    // Verify it's a password reset token
    if (payload.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired password reset token');
  }
};