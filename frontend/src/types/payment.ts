export enum PaymentStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface Payment {
  id?: string; // Standardized field name
  _id: string; // For backward compatibility
  contractId: string;
  companyId: string;
  recipientCompanyId: string;
  buyerId: string;
  milestone: string;
  amount: number; // Subtotal (excluding VAT)
  vatAmount?: number; // VAT amount
  vatRate?: number; // VAT rate (default 0.05 for UAE)
  totalAmount?: number; // Total including VAT
  currency: string;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount?: number;
  lastRetryAt?: string;
  paymentMethod?: string;
  gateway?: 'stripe' | 'paypal'; // Payment gateway
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  recipientCompanyId?: string;
  contractId?: string;
}

export interface ApprovePaymentDto {
  notes?: string;
}

export interface RejectPaymentDto {
  rejectionReason: string;
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

export interface ProcessPaymentDto {
  paymentMethod: string;
  gateway: 'stripe' | 'paypal';
  notes?: string;
}
