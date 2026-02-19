// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  requestId?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyId: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: string;
}

export interface RegisterCompanyData {
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

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  // refreshToken is NOT stored in frontend - it's in httpOnly cookie
  refreshToken?: string | null; // Optional for backward compatibility, but not used
  isAuthenticated: boolean;
}

// Role enum matching backend
export enum Role {
  BUYER = 'Buyer',
  COMPANY_MANAGER = 'Company Manager',
  SUPPLIER = 'Supplier',
  LOGISTICS = 'Logistics',
  CLEARANCE = 'Clearance',
  SERVICE_PROVIDER = 'Service Provider',
  GOVERNMENT = 'Government',
  ADMIN = 'Admin',
}

// Role helper functions
export const isAdmin = (role: string): boolean => role === Role.ADMIN;
export const isBuyer = (role: string): boolean => role === Role.BUYER;
export const isSupplier = (role: string): boolean => role === Role.SUPPLIER;
export const isGovernment = (role: string): boolean => role === Role.GOVERNMENT;
