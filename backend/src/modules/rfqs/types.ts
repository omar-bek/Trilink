import { RFQType, RFQStatus } from './schema';
import { CompanyType } from '../companies/schema';
import { Role } from '../../config/rbac';

export interface CreateRFQDto {
  purchaseRequestId: string;
  type: RFQType;
  targetRole: Role;
  targetCompanyType: CompanyType;
  targetCompanyIds?: string[]; // Optional: specific company IDs that should receive this RFQ
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
  }>;
  budget: number;
  currency?: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  requiredDeliveryDate: string;
  deadline: string;
  anonymousBuyer?: boolean;
}

export interface UpdateRFQDto {
  title?: string;
  description?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
  }>;
  budget?: number;
  deadline?: string;
  status?: RFQStatus;
}

export interface RFQResponse {
  id: string;
  purchaseRequestId: string;
  companyId: string;
  type: RFQType;
  targetRole: Role;
  targetCompanyType: CompanyType;
  targetCompanyIds: string[]; // Specific company IDs that should receive this RFQ (empty array if not specified)
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
  }>;
  budget: number;
  currency: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  requiredDeliveryDate: Date;
  deadline: Date;
  status: RFQStatus;
  anonymousBuyer: boolean;
  createdAt: Date;
  updatedAt: Date;
}
