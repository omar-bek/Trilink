export enum PurchaseRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
}

export interface PurchaseRequestItem {
  name: string;
  quantity: number;
  unit: string;
  specifications: string;
  estimatedPrice?: number;
}

export interface DeliveryLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PurchaseRequest {
  _id: string;
  id?: string; // Some APIs return id instead of _id
  buyerId: string;
  companyId: string;
  categoryId: string; // Required: Main category
  subCategoryId?: string; // Optional: Sub-category
  categoryName?: string; // Category name for display
  subCategoryName?: string; // Sub-category name for display
  title: string;
  description: string;
  items: PurchaseRequestItem[];
  budget: number;
  currency: string;
  deliveryLocation: DeliveryLocation;
  requiredDeliveryDate: string;
  status: PurchaseRequestStatus;
  rfqGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequestDto {
  categoryId: string; // Required: Main category
  subCategoryId?: string; // Optional: Sub-category
  title: string;
  description: string;
  items: PurchaseRequestItem[];
  budget: number;
  currency?: string;
  deliveryLocation: DeliveryLocation;
  requiredDeliveryDate: string;
}

export interface UpdatePurchaseRequestDto {
  categoryId?: string; // Optional: Can update category
  subCategoryId?: string; // Optional: Can update sub-category
  title?: string;
  description?: string;
  items?: PurchaseRequestItem[];
  budget?: number;
  currency?: string;
  deliveryLocation?: DeliveryLocation;
  requiredDeliveryDate?: string;
}

export interface PurchaseRequestFilters {
  status?: PurchaseRequestStatus;
  buyerId?: string;
  categoryId?: string;
  subCategoryId?: string;
}
