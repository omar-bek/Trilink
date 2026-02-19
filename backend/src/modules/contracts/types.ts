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
  signature: string; // Base64-encoded PKI digital signature
  certificate?: string; // Base64-encoded certificate (public key)
  algorithm?: string; // Signature algorithm (e.g., 'RSASSA-PKCS1-v1_5-SHA256')
  timestamp?: string; // ISO timestamp of signature
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
    signatureHash?: string;
    certificate?: string;
    algorithm?: string;
    verified?: boolean;
  }>;
  terms: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAmendmentDto {
  reason: string;
  description: string;
  changes: {
    terms?: string;
    amounts?: {
      total?: number;
      currency?: string;
      breakdown?: Array<{
        partyId: string;
        amount: number;
        description: string;
      }>;
    };
    paymentSchedule?: Array<{
      milestone: string;
      amount: number;
      dueDate: string;
      status?: string;
    }>;
    startDate?: string;
    endDate?: string;
  };
}

export interface ApproveAmendmentDto {
  approved: boolean;
  comments?: string;
}

export interface AmendmentResponse {
  id: string;
  contractId: string;
  version: number;
  amendmentNumber: string;
  reason: string;
  description: string;
  changes: {
    terms?: string;
    amounts?: {
      total?: number;
      currency?: string;
      breakdown?: Array<{
        partyId: string;
        amount: number;
        description: string;
      }>;
    };
    paymentSchedule?: Array<{
      milestone: string;
      amount: number;
      dueDate: Date;
      status: string;
    }>;
    startDate?: Date;
    endDate?: Date;
  };
  originalContract: {
    terms: string;
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
    startDate: Date;
    endDate: Date;
  };
  approvals: Array<{
    partyId: string;
    userId: string;
    approved: boolean;
    comments?: string;
    approvedAt?: Date;
  }>;
  status: string;
  createdBy: {
    userId: string;
    companyId: string;
  };
  appliedAt?: Date;
  appliedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractQueryFilters {
  search?: string;
  status?: ContractStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContractVersionResponse {
  id: string;
  contractId: string;
  version: number;
  snapshot: {
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
    terms: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  signatures: Array<{
    partyId: string;
    userId: string;
    signedAt: Date;
    signature: string;
    signatureHash: string;
    certificate?: string;
    algorithm?: string;
    verified: boolean;
  }>;
  createdBy?: {
    userId: string;
    companyId: string;
  };
  reason?: string;
  amendmentId?: string;
  createdAt: Date;
}

export interface VersionDiffResponse {
  version1: ContractVersionResponse;
  version2: ContractVersionResponse;
  differences: {
    field: string;
    path: string;
    oldValue: any;
    newValue: any;
  }[];
}