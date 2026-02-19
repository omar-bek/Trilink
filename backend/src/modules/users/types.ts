import { Role, Permission } from '../../config/rbac';
import { Status } from '../../types/common';

export interface CreateUserDto {
  email: string;
  password: string;
  role: Role;
  companyId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  customPermissions?: Permission[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: Status;
  role?: Role;
  customPermissions?: Permission[];
}

export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: Role;
  companyId: string;
  companyName?: string;
  status: Status;
  firstName?: string;
  lastName?: string;
  phone?: string;
  lastLogin?: Date;
  customPermissions?: Permission[];
  createdAt: Date;
  updatedAt: Date;
}
