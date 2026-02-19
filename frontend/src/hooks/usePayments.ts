import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import {
  PaymentFilters,
  ApprovePaymentDto,
  RejectPaymentDto,
  RetryPaymentDto,
  UpdatePaymentMethodDto,
  ProcessPaymentDto,
} from '@/types/payment';
import { PaginationParams } from '@/utils/pagination';
import { notificationService } from '@/utils/notification';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';

export const usePayments = (filters?: PaymentFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.payments.list(filters, pagination),
    queryFn: () => paymentService.getPayments(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePayment = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.payments.detail(id!),
    queryFn: () => paymentService.getPaymentById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useApprovePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApprovePaymentDto }) =>
      paymentService.approvePayment(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'payments');
      invalidateDetailQuery(queryClient, 'payments', variables.id);
      notificationService.showSuccess('Payment approved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to approve payment';
      notificationService.showError(message);
    },
  });
};

export const useRejectPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectPaymentDto }) =>
      paymentService.rejectPayment(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'payments');
      invalidateDetailQuery(queryClient, 'payments', variables.id);
      notificationService.showSuccess('Payment rejected');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject payment';
      notificationService.showError(message);
    },
  });
};

export const usePaymentsByContract = (contractId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.payments.list({ contractId }, undefined),
    queryFn: () => paymentService.getPaymentsByContract(contractId!),
    enabled: !!contractId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRetryPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RetryPaymentDto }) =>
      paymentService.retryPayment(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'payments');
      invalidateDetailQuery(queryClient, 'payments', variables.id);
      notificationService.showSuccess('Payment retry initiated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to retry payment';
      notificationService.showError(message);
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentMethodDto }) =>
      paymentService.updatePaymentMethod(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'payments');
      invalidateDetailQuery(queryClient, 'payments', variables.id);
      notificationService.showSuccess('Payment method updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update payment method';
      notificationService.showError(message);
    },
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProcessPaymentDto }) =>
      paymentService.processPayment(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'payments');
      invalidateDetailQuery(queryClient, 'payments', variables.id);
      notificationService.showSuccess('Payment processing initiated successfully');
    },
    onError: (error: any) => {
      // Handle different error types
      const errorData = error.response?.data;
      let message = 'Failed to process payment';

      if (errorData?.error === 'Validation error') {
        message = errorData.message || 'Please check the payment details and try again';
      } else if (errorData?.error === 'Payment gateway error') {
        message = errorData.message || 'Payment gateway error. Please try again or contact support';
      } else if (error.response?.status === 403) {
        message = 'You do not have permission to process this payment';
      } else if (error.response?.status === 400) {
        message = errorData?.message || 'Invalid payment data';
      } else {
        message = errorData?.message || error.message || message;
      }

      notificationService.showError(message);
    },
  });
};