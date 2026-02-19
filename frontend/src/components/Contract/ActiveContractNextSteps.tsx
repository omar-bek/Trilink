import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { WorkflowNextSteps, WorkflowIcons } from '@/components/Workflow/WorkflowNextSteps';

interface ActiveContractNextStepsProps {
  contractId: string;
}

export const ActiveContractNextSteps = ({ contractId }: ActiveContractNextStepsProps) => {
  const { data: paymentsData } = useQuery({
    queryKey: ['payments-by-contract', contractId],
    queryFn: () => paymentService.getPaymentsByContract(contractId),
    enabled: !!contractId,
  });

  const payments = paymentsData?.data || [];

  return (
    <WorkflowNextSteps
      title="Next Steps: Manage Payments"
      steps={[
        {
          id: 'view-payments',
          title: 'Review Payment Schedule',
          description: payments.length > 0
            ? `${payments.length} payment${payments.length > 1 ? 's' : ''} created from the payment schedule. Review and approve payments as milestones are completed.`
            : 'Payments will be created automatically from the payment schedule. Monitor them as contract milestones are completed.',
          action: {
            label: payments.length > 0 ? 'View Payments' : 'View Payment Schedule',
            path: payments.length > 0 ? `/payments?contractId=${contractId}` : `#payment-schedule`,
          },
          icon: WorkflowIcons.Payment,
          required: false,
        },
      ]}
    />
  );
};
