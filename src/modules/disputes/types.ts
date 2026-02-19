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
  createdAt: Date;
  updatedAt: Date;
}
