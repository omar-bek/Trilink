export interface UserProfile {
  _id?: string;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  companyId: string;
  companyName?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  customPermissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  role: string;
  companyId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
