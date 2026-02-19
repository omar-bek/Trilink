import { PaymentStatus } from './schema';

export interface CreatePaymentDto {
  contractId: string;
  recipientCompanyId: string;
  milestone: string;
  amount: number; // Subtotal (excluding VAT)
  vatRate?: number; // VAT rate (default 0.05 for UAE)
  currency?: string;
  dueDate: string;
  notes?: string;
}

export interface ApprovePaymentDto {
  notes?: string;
}

export interface RejectPaymentDto {
  rejectionReason: string;
}

export interface ProcessPaymentDto {
  paymentMethod: string;
  gateway: 'stripe' | 'paypal';
  notes?: string;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  paidDate?: string;
  notes?: string;
}

export interface RetryPaymentDto {
  paymentMethod?: string;
  gateway?: 'stripe' | 'paypal';
  notes?: string;
}

export interface UpdatePaymentMethodDto {
  paymentMethod: string;
  gateway: 'stripe' | 'paypal';
  notes?: string;
}

export interface PaymentResponse {
  id: string;
  contractId: string;
  companyId: string;
  recipientCompanyId: string;
  buyerId: string;
  milestone: string;
  amount: number; // Subtotal (excluding VAT)
  vatAmount?: number; // VAT amount
  vatRate?: number; // VAT rate
  totalAmount: number; // Total including VAT
  currency: string;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  failedAt?: Date;
  failureReason?: string;
  retryCount?: number;
  lastRetryAt?: Date;
  paymentMethod?: string;
  transactionId?: string;
  gateway?: string;
  gatewayIntentId?: string;
  gatewayClientSecret?: string;
  gatewayRedirectUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
