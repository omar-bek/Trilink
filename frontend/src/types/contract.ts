export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURES = 'pending_signatures',
  SIGNED = 'signed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
}

export interface ContractParty {
  companyId: string;
  userId: string;
  role: string;
  bidId?: string;
}

export interface AmountBreakdown {
  partyId: string;
  amount: number;
  description: string;
}

export interface ContractAmounts {
  total: number;
  currency: string;
  breakdown: AmountBreakdown[];
}

export interface PaymentMilestone {
  milestone: string;
  amount: number;
  dueDate: string;
  status: string;
}

export interface ContractSignature {
  partyId: string;
  userId: string;
  signedAt: string;
  signature: string;
  signatureHash?: string;
  certificate?: string;
  algorithm?: string;
  verified?: boolean;
}

export interface Contract {
  id?: string; // Standardized field name
  _id: string; // For backward compatibility
  purchaseRequestId: string;
  buyerCompanyId: string;
  parties: ContractParty[];
  amounts: ContractAmounts;
  paymentSchedule: PaymentMilestone[];
  signatures: ContractSignature[];
  terms: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  version?: number;
  versionNumber?: number; // Alternative field name
  createdAt: string;
  updatedAt: string;
}

export interface SignContractDto {
  signature: string;
}

export interface ContractFilters {
  status?: ContractStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  categoryId?: string;
  subCategoryId?: string;
}

export interface CreateContractDto {
  purchaseRequestId: string;
  parties: ContractParty[];
  amounts: ContractAmounts;
  paymentSchedule: PaymentMilestone[];
  terms: string;
  startDate: string;
  endDate: string;
}

export interface UpdateContractDto {
  terms?: string;
  paymentSchedule?: PaymentMilestone[];
  status?: ContractStatus;
}

export interface AmendmentChanges {
  terms?: string;
  amounts?: {
    total?: number;
    currency?: string;
    breakdown?: AmountBreakdown[];
  };
  paymentSchedule?: PaymentMilestone[];
  startDate?: string;
  endDate?: string;
}

export interface CreateAmendmentDto {
  reason: string;
  description: string;
  changes: AmendmentChanges;
}

export interface ApproveAmendmentDto {
  approved: boolean;
  comments?: string;
}

export interface AmendmentApproval {
  partyId: string;
  userId: string;
  approved: boolean;
  comments?: string;
  approvedAt?: string;
}

export interface Amendment {
  id: string;
  contractId: string;
  version: number;
  amendmentNumber: string;
  reason: string;
  description: string;
  changes: AmendmentChanges;
  originalContract: {
    terms: string;
    amounts: ContractAmounts;
    paymentSchedule: PaymentMilestone[];
    startDate: string;
    endDate: string;
  };
  approvals: AmendmentApproval[];
  status: string;
  createdBy: {
    userId: string;
    companyId: string;
  };
  appliedAt?: string;
  appliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractVersion {
  id: string;
  contractId: string;
  version: number;
  snapshot: {
    purchaseRequestId: string;
    buyerCompanyId: string;
    parties: ContractParty[];
    amounts: ContractAmounts;
    paymentSchedule: PaymentMilestone[];
    terms: string;
    startDate: string;
    endDate: string;
    status: ContractStatus;
  };
  signatures: ContractSignature[];
  createdBy?: {
    userId: string;
    companyId: string;
  };
  reason?: string;
  amendmentId?: string;
  createdAt: string;
}

export interface VersionDiff {
  version1: ContractVersion;
  version2: ContractVersion;
  differences: Array<{
    field: string;
    path: string;
    oldValue: any;
    newValue: any;
  }>;
}