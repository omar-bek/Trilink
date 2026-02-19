import { Role } from '../../config/rbac';
import { Status } from '../../types/common';

export interface CreateUserDto {
  email: string;
  password: string;
  role: Role;
  companyId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: Status;
}

export interface UserResponse {
  id: string;
  email: string;
  role: Role;
  companyId: string;
  status: Status;
  firstName?: string;
  lastName?: string;
  phone?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
