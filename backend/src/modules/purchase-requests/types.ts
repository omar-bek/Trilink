import { PurchaseRequestStatus } from './schema';

export interface CreatePurchaseRequestDto {
  categoryId: string; // Required: Main category
  subCategoryId?: string; // Optional: Sub-category
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
    estimatedPrice?: number;
  }>;
  budget: number;
  currency?: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  requiredDeliveryDate: string;
}

export interface UpdatePurchaseRequestDto {
  categoryId?: string; // Optional: Can update category
  subCategoryId?: string; // Optional: Can update sub-category
  title?: string;
  description?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
    estimatedPrice?: number;
  }>;
  budget?: number;
  currency?: string;
  deliveryLocation?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  requiredDeliveryDate?: string;
  status?: PurchaseRequestStatus;
}

export interface PurchaseRequestResponse {
  id: string;
  buyerId: string;
  companyId: string;
  categoryId: string; // Required: Main category
  subCategoryId?: string; // Optional: Sub-category
  categoryName?: string; // Category name for display
  subCategoryName?: string; // Sub-category name for display
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
    estimatedPrice?: number;
  }>;
  budget: number;
  currency: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  requiredDeliveryDate: Date;
  status: PurchaseRequestStatus;
  approverId?: string;
  approvalHistory: Array<{
    status: PurchaseRequestStatus;
    approverId?: string;
    approverName?: string;
    notes?: string;
    timestamp: Date;
  }>;
  rfqGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovePurchaseRequestDto {
  notes?: string;
  rfqTypes?: string[]; // Optional: specify which RFQ types to generate (e.g., ['Supplier', 'Logistics', 'Clearance', 'Service Provider'])
  // If not provided, all RFQ types will be generated
}
