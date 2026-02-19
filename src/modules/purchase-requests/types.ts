import { PurchaseRequestStatus } from './schema';

export interface CreatePurchaseRequestDto {
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
  rfqGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
