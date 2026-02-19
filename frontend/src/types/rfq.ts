import { Role } from './index';

export enum RFQType {
  SUPPLIER = 'Supplier',
  LOGISTICS = 'Logistics',
  CLEARANCE = 'Clearance',
  SERVICE_PROVIDER = 'Service Provider',
}

export enum RFQStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export interface RFQItem {
  name: string;
  quantity: number;
  unit: string;
  specifications: string;
}

export interface DeliveryLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface RFQ {
  id: string;
  _id?: string; // For backward compatibility
  rfqNumber?: string; // Auto-generated RFQ number
  purchaseRequestId: string;
  companyId: string;
  type: RFQType;
  targetRole: Role;
  targetCompanyType: string;
  targetCompanyIds?: string[]; // Specific company IDs that should receive this RFQ
  categoryId?: string; // Category ID from purchase request
  subCategoryId?: string; // Sub-category ID from purchase request
  categoryName?: string; // Category name for display
  subCategoryName?: string; // Sub-category name for display
  title: string;
  description: string;
  items: RFQItem[];
  budget: number;
  currency: string;
  deliveryLocation: DeliveryLocation;
  requiredDeliveryDate: string;
  deadline: string;
  status: RFQStatus;
  anonymousBuyer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RFQFilters {
  type?: RFQType;
  status?: RFQStatus;
  targetRole?: Role;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
}

export interface CreateRFQDto {
  purchaseRequestId: string;
  type: RFQType;
  targetRole: Role;
  targetCompanyType: string;
  targetCompanyIds?: string[]; // Optional: specific company IDs that should receive this RFQ
  title: string;
  description: string;
  items: RFQItem[];
  budget: number;
  currency?: string;
  deliveryLocation: DeliveryLocation;
  requiredDeliveryDate: string;
  deadline: string;
  anonymousBuyer?: boolean;
}

export interface UpdateRFQDto {
  title?: string;
  description?: string;
  items?: RFQItem[];
  budget?: number;
  deadline?: string;
  status?: RFQStatus;
}