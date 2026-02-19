import { BidStatus } from './schema';

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
  }>; // Payment schedule with amounts and percentages (must total 100%)
  deliveryTime: number;
  deliveryDate: string;
  validity: string; // Bid validity expiration date
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number; // Price per item
  }>;
  anonymousBidder?: boolean;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
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
  status?: BidStatus;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}

export interface EvaluateBidDto {
  status: BidStatus;
  notes?: string;
}

export interface BidResponse {
  id: string;
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
    dueDate?: Date;
    description?: string;
  }>;
  deliveryTime: number;
  deliveryDate: Date;
  validity: Date;
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
    timestamp: Date;
    modelVersion?: string;
  };
  status: BidStatus;
  anonymousBidder: boolean;
  attachments?: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
