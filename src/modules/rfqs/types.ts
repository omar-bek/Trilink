import { RFQType, RFQStatus } from './schema';
import { CompanyType } from '../companies/schema';

export interface CreateRFQDto {
  purchaseRequestId: string;
  type: RFQType;
  targetCompanyType: CompanyType;
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
  isAnonymous?: boolean;
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
  targetCompanyType: CompanyType;
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
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}
