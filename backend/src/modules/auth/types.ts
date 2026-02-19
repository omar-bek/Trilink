export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: string;
  companyId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RegisterCompanyDto {
  // Company information
  companyName: string;
  registrationNumber: string;
  companyType: string;
  companyEmail: string;
  companyPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  documents?: Array<{
    type: string;
    url: string;
  }>;
  categoryIds?: string[]; // Optional category IDs
  // User information (company manager/owner)
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// RefreshTokenDto removed - refresh token is now read from httpOnly cookie
// No request body needed for refresh endpoint

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    companyId: string;
    firstName?: string;
    lastName?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string; // New refresh token for rotation
  user: {
    id: string;
    email: string;
    role: string;
    companyId: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}