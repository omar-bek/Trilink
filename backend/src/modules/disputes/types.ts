import { DisputeStatus } from './schema';

export interface CreateDisputeDto {
  contractId: string;
  againstCompanyId: string;
  type: string;
  description: string;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}

export interface UpdateDisputeDto {
  status?: DisputeStatus;
  resolution?: string;
}

export interface EscalateDisputeDto {
  governmentNotes?: string;
  assignedToUserId: string; // Required: must assign to a government user
  dueDate?: Date; // Optional: custom due date (defaults to SLA calculation)
}

export interface AddAttachmentDto {
  attachments: Array<{
    type: string;
    url: string;
  }>;
}

export interface ResolveDisputeDto {
  resolution: string;
}

export interface AssignDisputeDto {
  assignedToUserId: string;
  dueDate?: Date; // Optional: custom due date
}

export interface DisputeResponse {
  id: string;
  contractId: string;
  companyId: string;
  raisedBy: string;
  againstCompanyId: string;
  type: string;
  description: string;
  attachments: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  status: DisputeStatus;
  resolution?: string;
  escalatedToGovernment: boolean;
  governmentNotes?: string;
  assignedTo?: string; // Assigned government user ID
  assignedAt?: Date;
  assignedBy?: string; // Who assigned the dispute
  dueDate?: Date; // SLA due date
  responseTime?: number; // Response time in hours
  createdAt: Date;
  updatedAt: Date;
}
