export enum BidStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface BidAttachment {
  type: string;
  url: string;
  uploadedAt?: string;
}

export interface Bid {
  id?: string; // Standardized field name
  _id: string; // For backward compatibility
  rfqId: string;
  companyId: string;
  providerId: string;
  price: number;
  currency: string;
  paymentTerms: string;
  paymentSchedule?: Array<{
    milestone: string;
    amount?: number;
    percentage?: number;
    dueDate?: string;
    description?: string;
  }>;
  deliveryTime: number;
  deliveryDate: string;
  validity: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  aiScore?: number;
  aiScoreMetadata?: {
    totalScore: number;
    breakdown: {
      price: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
      delivery: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
      terms: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
      history: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
    };
    overallConfidence: string;
    overallRisk: string;
    recommendation: string;
    timestamp: string;
    modelVersion?: string;
  };
  status: BidStatus;
  anonymousBidder: boolean;
  attachments?: BidAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidDto {
  rfqId: string;
  price: number;
  currency?: string;
  paymentTerms: string;
  paymentSchedule?: Array<{
    milestone: string;
    amount?: number;
    percentage?: number;
    dueDate?: string;
    description?: string;
  }>;
  deliveryTime: number;
  deliveryDate: string;
  validity: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number; // Price per item
  }>;
  anonymousBidder?: boolean;
  attachments?: BidAttachment[];
  // Logistics-specific fields
  costPerShipment?: number;
  transitTime?: number; // in days
  route?: string;
  trackingAvailable?: boolean;
}

export interface UpdateBidDto {
  price?: number;
  paymentTerms?: string;
  paymentSchedule?: Array<{
    milestone: string;
    amount?: number;
    percentage?: number;
    dueDate?: string;
    description?: string;
  }>;
  deliveryTime?: number;
  deliveryDate?: string;
  validity?: string;
  attachments?: BidAttachment[];
}

export interface EvaluateBidDto {
  status: BidStatus;
  notes?: string;
}

export interface BidFilters {
  status?: BidStatus;
  rfqId?: string;
  categoryId?: string;
  subCategoryId?: string;
}
