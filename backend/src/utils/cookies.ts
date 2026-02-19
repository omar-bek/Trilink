import { Response } from 'express';
import { config } from '../config/env';

/**
 * Cookie configuration for secure refresh tokens
 * Suitable for government platform security requirements
 */
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Cookie options for refresh token
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: Only sent over HTTPS in production
 * - sameSite: 'strict' prevents CSRF attacks
 * - maxAge: 7 days (matches JWT refresh token expiry)
 */
const getRefreshTokenCookieOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
} => {
  const isProduction = config.nodeEnv === 'production';
  
  return {
    httpOnly: true, // Critical: Prevents JavaScript access
    secure: isProduction, // Only HTTPS in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/auth', // Only sent to auth endpoints (where refresh endpoint reads it)
  };
};

/**
 * Set refresh token in httpOnly cookie
 */
export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());
};

/**
 * Clear refresh token cookie
 */
export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
};

/**
 * Get refresh token from cookie
 */
export const getRefreshTokenFromCookie = (req: any): string | undefined => {
  return req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
};
