import { BidStatus } from './schema';

export interface CreateBidDto {
  rfqId: string;
  price: number;
  currency?: string;
  terms: string;
  deliveryTime: number;
  deliveryDate: string;
  isAnonymous?: boolean;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}

export interface UpdateBidDto {
  price?: number;
  terms?: string;
  deliveryTime?: number;
  deliveryDate?: string;
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
  terms: string;
  deliveryTime: number;
  deliveryDate: Date;
  aiScore?: number;
  status: BidStatus;
  isAnonymous: boolean;
  attachments?: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
