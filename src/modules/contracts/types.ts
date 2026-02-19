import { ContractStatus } from './schema';

export interface CreateContractDto {
  purchaseRequestId: string;
  parties: Array<{
    companyId: string;
    userId: string;
    role: string;
    bidId?: string;
  }>;
  amounts: {
    total: number;
    currency?: string;
    breakdown: Array<{
      partyId: string;
      amount: number;
      description: string;
    }>;
  };
  paymentSchedule: Array<{
    milestone: string;
    amount: number;
    dueDate: string;
  }>;
  terms: string;
  startDate: string;
  endDate: string;
}

export interface SignContractDto {
  signature: string; // Digital signature hash
}

export interface UpdateContractDto {
  terms?: string;
  paymentSchedule?: Array<{
    milestone: string;
    amount: number;
    dueDate: string;
    status?: string;
  }>;
  status?: ContractStatus;
}

export interface ContractResponse {
  id: string;
  purchaseRequestId: string;
  buyerCompanyId: string;
  parties: Array<{
    companyId: string;
    userId: string;
    role: string;
    bidId?: string;
  }>;
  amounts: {
    total: number;
    currency: string;
    breakdown: Array<{
      partyId: string;
      amount: number;
      description: string;
    }>;
  };
  paymentSchedule: Array<{
    milestone: string;
    amount: number;
    dueDate: Date;
    status: string;
  }>;
  signatures: Array<{
    partyId: string;
    userId: string;
    signedAt: Date;
    signature: string;
  }>;
  terms: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
}
