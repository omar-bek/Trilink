export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
}

export interface DisputeAttachment {
  type: string;
  url: string;
  uploadedAt?: string;
}

export interface Dispute {
  id?: string; // Standardized field name
  _id: string; // For backward compatibility
  contractId: string;
  companyId: string;
  raisedBy: string;
  againstCompanyId: string;
  type: string;
  description: string;
  attachments: DisputeAttachment[];
  status: DisputeStatus;
  resolution?: string;
  escalatedToGovernment: boolean;
  governmentNotes?: string;
  assignedToUserId?: string; // Assigned government user ID (backend field name)
  assignedTo?: string; // Assigned government user ID (alternative)
  assignedAt?: string; // ISO date string
  assignedBy?: string; // Who assigned the dispute
  dueDate?: string; // SLA due date (ISO date string)
  responseTime?: number; // Response time in hours
  createdAt: string;
  updatedAt: string;
}

export interface AssignDisputeDto {
  assignedToUserId: string;
  dueDate?: string; // ISO date string
}

export interface CreateDisputeDto {
  contractId: string;
  againstCompanyId: string;
  type: string;
  description: string;
  attachments?: DisputeAttachment[];
}

export interface EscalateDisputeDto {
  governmentNotes?: string;
  assignedToUserId: string; // Required when escalating
  dueDate?: string; // Optional: ISO date string
}

export interface ResolveDisputeDto {
  resolution: string;
}

export interface AddAttachmentDto {
  attachments: DisputeAttachment[];
}

export interface UpdateDisputeDto {
  status?: DisputeStatus;
  resolution?: string;
}

export interface DisputeFilters {
  status?: DisputeStatus;
  escalated?: boolean;
}

export const DISPUTE_TYPES = [
  'Quality',
  'Delivery',
  'Payment',
  'Contract Terms',
  'Service',
  'Other',
] as const;
