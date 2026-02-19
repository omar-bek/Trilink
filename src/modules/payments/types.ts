import { PaymentStatus } from './schema';

export interface CreatePaymentDto {
  contractId: string;
  recipientCompanyId: string;
  milestone: string;
  amount: number;
  currency?: string;
  dueDate: string;
  notes?: string;
}

export interface ProcessPaymentDto {
  paymentMethod: string;
  transactionId: string;
  notes?: string;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  paidDate?: string;
  notes?: string;
}

export interface PaymentResponse {
  id: string;
  contractId: string;
  companyId: string;
  recipientCompanyId: string;
  milestone: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
