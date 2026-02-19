import { CompanyType } from './schema';
import { Status } from '../../types/common';

export interface CreateCompanyDto {
  name: string;
  registrationNumber: string;
  type: CompanyType;
  email: string;
  phone: string;
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
}

export interface UpdateCompanyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  documents?: Array<{
    type: string;
    url: string;
  }>;
  status?: Status;
}

export interface CompanyResponse {
  id: string;
  name: string;
  registrationNumber: string;
  type: CompanyType;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
