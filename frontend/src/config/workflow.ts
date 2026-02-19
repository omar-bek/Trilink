import { RFQStatus } from '@/types/rfq';
import { BidStatus } from '@/types/bid';
import { ContractStatus } from '@/types/contract';
import { ShipmentStatus } from '@/types/shipment';
import { PaymentStatus } from '@/types/payment';
import { Role } from '@/types';

export type EntityType = 'rfq' | 'bid' | 'contract' | 'shipment' | 'payment';

export interface WorkflowStep {
  status: string;
  label: string;
  description: string;
  previousStep?: {
    label: string;
    description: string;
  };
  nextAction: {
    label: string;
    description: string;
    cta?: {
      label: string;
      path?: string;
      action?: string;
      roles?: Role[];
      variant?: 'contained' | 'outlined' | 'text';
    };
  };
  isTerminal?: boolean;
  isEmpty?: boolean;
}

export interface EntityWorkflow {
  entityType: EntityType;
  entityLabel: string;
  steps: Record<string, WorkflowStep>;
}

// RFQ Workflow
export const rfqWorkflow: EntityWorkflow = {
  entityType: 'rfq',
  entityLabel: 'RFQ',
  steps: {
    [RFQStatus.DRAFT]: {
      status: RFQStatus.DRAFT,
      label: 'Draft',
      description: 'RFQ is being prepared',
      nextAction: {
        label: 'Publish RFQ',
        description: 'Make this RFQ available for providers to submit bids',
        cta: {
          label: 'Publish RFQ',
          action: 'publish',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [RFQStatus.OPEN]: {
      status: RFQStatus.OPEN,
      label: 'Open',
      description: 'RFQ is accepting bids',
      previousStep: {
        label: 'Draft',
        description: 'RFQ was created and published',
      },
      nextAction: {
        label: 'Wait for Bids',
        description: 'Providers can submit bids until the deadline',
        cta: {
          label: 'View Bids',
          path: '/rfqs',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'outlined',
        },
      },
    },
    [RFQStatus.CLOSED]: {
      status: RFQStatus.CLOSED,
      label: 'Closed',
      description: 'RFQ deadline has passed',
      previousStep: {
        label: 'Open',
        description: 'RFQ was accepting bids',
      },
      nextAction: {
        label: 'Review Bids',
        description: 'Evaluate submitted bids and accept the best one',
        cta: {
          label: 'Review Bids',
          path: '/rfqs',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [RFQStatus.CANCELLED]: {
      status: RFQStatus.CANCELLED,
      label: 'Cancelled',
      description: 'RFQ has been cancelled',
      previousStep: {
        label: 'Open or Draft',
        description: 'RFQ was previously active',
      },
      nextAction: {
        label: 'No further action',
        description: 'This RFQ has been cancelled',
      },
      isTerminal: true,
    },
  },
};

// Bid Workflow
export const bidWorkflow: EntityWorkflow = {
  entityType: 'bid',
  entityLabel: 'Bid',
  steps: {
    [BidStatus.DRAFT]: {
      status: BidStatus.DRAFT,
      label: 'Draft',
      description: 'Bid is being prepared',
      nextAction: {
        label: 'Submit Bid',
        description: 'Submit your bid for review',
        cta: {
          label: 'Submit Bid',
          action: 'submit',
          roles: [Role.SUPPLIER, Role.LOGISTICS, Role.CLEARANCE, Role.SERVICE_PROVIDER],
          variant: 'contained',
        },
      },
    },
    [BidStatus.SUBMITTED]: {
      status: BidStatus.SUBMITTED,
      label: 'Submitted',
      description: 'Bid has been submitted and is awaiting review',
      previousStep: {
        label: 'Draft',
        description: 'Bid was created and submitted',
      },
      nextAction: {
        label: 'Wait for Review',
        description: 'Buyer will review your bid',
      },
    },
    [BidStatus.UNDER_REVIEW]: {
      status: BidStatus.UNDER_REVIEW,
      label: 'Under Review',
      description: 'Bid is being evaluated by the buyer',
      previousStep: {
        label: 'Submitted',
        description: 'Bid was submitted for review',
      },
      nextAction: {
        label: 'Wait for Decision',
        description: 'Buyer is evaluating your bid',
      },
    },
    [BidStatus.ACCEPTED]: {
      status: BidStatus.ACCEPTED,
      label: 'Accepted',
      description: 'Bid has been accepted',
      previousStep: {
        label: 'Under Review',
        description: 'Bid was reviewed and accepted',
      },
      nextAction: {
        label: 'Contract Creation',
        description: 'A contract will be generated from accepted bids',
        cta: {
          label: 'View Contract',
          path: '/contracts',
          roles: [Role.BUYER, Role.SUPPLIER, Role.LOGISTICS, Role.CLEARANCE, Role.SERVICE_PROVIDER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [BidStatus.REJECTED]: {
      status: BidStatus.REJECTED,
      label: 'Rejected',
      description: 'Bid has been rejected',
      previousStep: {
        label: 'Under Review',
        description: 'Bid was reviewed and rejected',
      },
      nextAction: {
        label: 'No further action',
        description: 'This bid has been rejected',
      },
      isTerminal: true,
    },
    [BidStatus.WITHDRAWN]: {
      status: BidStatus.WITHDRAWN,
      label: 'Withdrawn',
      description: 'Bid has been withdrawn',
      previousStep: {
        label: 'Submitted or Under Review',
        description: 'Bid was previously active',
      },
      nextAction: {
        label: 'No further action',
        description: 'This bid has been withdrawn',
      },
      isTerminal: true,
    },
  },
};

// Contract Workflow
export const contractWorkflow: EntityWorkflow = {
  entityType: 'contract',
  entityLabel: 'Contract',
  steps: {
    [ContractStatus.DRAFT]: {
      status: ContractStatus.DRAFT,
      label: 'Draft',
      description: 'Contract is being prepared',
      nextAction: {
        label: 'Review Contract',
        description: 'Review contract terms before signing',
        cta: {
          label: 'Review Contract',
          action: 'review',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [ContractStatus.PENDING_SIGNATURES]: {
      status: ContractStatus.PENDING_SIGNATURES,
      label: 'Pending Signatures',
      description: 'Waiting for all parties to sign',
      previousStep: {
        label: 'Draft',
        description: 'Contract was created from accepted bids',
      },
      nextAction: {
        label: 'Sign Contract',
        description: 'All parties must sign the contract',
        cta: {
          label: 'Sign Contract',
          action: 'sign',
          roles: [Role.BUYER, Role.SUPPLIER, Role.LOGISTICS, Role.CLEARANCE, Role.SERVICE_PROVIDER],
          variant: 'contained',
        },
      },
    },
    [ContractStatus.SIGNED]: {
      status: ContractStatus.SIGNED,
      label: 'Signed',
      description: 'All parties have signed the contract',
      previousStep: {
        label: 'Pending Signatures',
        description: 'All parties signed the contract',
      },
      nextAction: {
        label: 'Activate Contract',
        description: 'Activate the contract to begin execution',
        cta: {
          label: 'Activate Contract',
          action: 'activate',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [ContractStatus.ACTIVE]: {
      status: ContractStatus.ACTIVE,
      label: 'Active',
      description: 'Contract is active and in execution',
      previousStep: {
        label: 'Signed',
        description: 'Contract was activated',
      },
      nextAction: {
        label: 'Monitor Execution',
        description: 'Track shipments and process payments',
        cta: {
          label: 'View Shipments',
          path: '/shipments',
          roles: [Role.BUYER, Role.LOGISTICS, Role.ADMIN],
          variant: 'outlined',
        },
      },
    },
    [ContractStatus.COMPLETED]: {
      status: ContractStatus.COMPLETED,
      label: 'Completed',
      description: 'Contract has been completed',
      previousStep: {
        label: 'Active',
        description: 'All contract obligations have been fulfilled',
      },
      nextAction: {
        label: 'No further action',
        description: 'This contract has been completed',
      },
      isTerminal: true,
    },
    [ContractStatus.TERMINATED]: {
      status: ContractStatus.TERMINATED,
      label: 'Terminated',
      description: 'Contract has been terminated',
      previousStep: {
        label: 'Active',
        description: 'Contract was terminated',
      },
      nextAction: {
        label: 'No further action',
        description: 'This contract has been terminated',
      },
      isTerminal: true,
    },
    [ContractStatus.CANCELLED]: {
      status: ContractStatus.CANCELLED,
      label: 'Cancelled',
      description: 'Contract has been cancelled',
      previousStep: {
        label: 'Draft or Pending Signatures',
        description: 'Contract was cancelled',
      },
      nextAction: {
        label: 'No further action',
        description: 'This contract has been cancelled',
      },
      isTerminal: true,
    },
  },
};

// Shipment Workflow
export const shipmentWorkflow: EntityWorkflow = {
  entityType: 'shipment',
  entityLabel: 'Shipment',
  steps: {
    [ShipmentStatus.IN_PRODUCTION]: {
      status: ShipmentStatus.IN_PRODUCTION,
      label: 'In Production',
      description: 'Items are being produced or prepared',
      nextAction: {
        label: 'Monitor Production',
        description: 'Track production progress',
      },
    },
    [ShipmentStatus.READY_FOR_PICKUP]: {
      status: ShipmentStatus.READY_FOR_PICKUP,
      label: 'Ready for Pickup',
      description: 'Items are ready for logistics pickup',
      previousStep: {
        label: 'In Production',
        description: 'Production completed',
      },
      nextAction: {
        label: 'Schedule Pickup',
        description: 'Logistics provider should pick up the shipment',
        cta: {
          label: 'Update Status',
          action: 'update_status',
          roles: [Role.LOGISTICS, Role.SUPPLIER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [ShipmentStatus.IN_TRANSIT]: {
      status: ShipmentStatus.IN_TRANSIT,
      label: 'In Transit',
      description: 'Shipment is in transit to destination',
      previousStep: {
        label: 'Ready for Pickup',
        description: 'Shipment was picked up',
      },
      nextAction: {
        label: 'Track Shipment',
        description: 'Monitor shipment location and progress',
        cta: {
          label: 'View Tracking',
          path: '/shipments',
          roles: [Role.BUYER, Role.LOGISTICS, Role.ADMIN],
          variant: 'outlined',
        },
      },
    },
    [ShipmentStatus.IN_CLEARANCE]: {
      status: ShipmentStatus.IN_CLEARANCE,
      label: 'In Clearance',
      description: 'Shipment is at customs for clearance',
      previousStep: {
        label: 'In Transit',
        description: 'Shipment arrived at customs',
      },
      nextAction: {
        label: 'Complete Clearance',
        description: 'Clearance provider should process customs clearance',
        cta: {
          label: 'Process Clearance',
          action: 'process_clearance',
          roles: [Role.CLEARANCE, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [ShipmentStatus.DELIVERED]: {
      status: ShipmentStatus.DELIVERED,
      label: 'Delivered',
      description: 'Shipment has been delivered',
      previousStep: {
        label: 'In Transit or In Clearance',
        description: 'Shipment was delivered to destination',
      },
      nextAction: {
        label: 'Confirm Delivery',
        description: 'Verify delivery completion and process final payment',
        cta: {
          label: 'View Payments',
          path: '/payments',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'outlined',
        },
      },
      isTerminal: true,
    },
    [ShipmentStatus.CANCELLED]: {
      status: ShipmentStatus.CANCELLED,
      label: 'Cancelled',
      description: 'Shipment has been cancelled',
      previousStep: {
        label: 'Previous Status',
        description: 'Shipment was cancelled',
      },
      nextAction: {
        label: 'No further action',
        description: 'This shipment has been cancelled',
      },
      isTerminal: true,
    },
  },
};

// Payment Workflow
export const paymentWorkflow: EntityWorkflow = {
  entityType: 'payment',
  entityLabel: 'Payment',
  steps: {
    [PaymentStatus.PENDING_APPROVAL]: {
      status: PaymentStatus.PENDING_APPROVAL,
      label: 'Pending Approval',
      description: 'Payment is awaiting buyer approval',
      nextAction: {
        label: 'Approve Payment',
        description: 'Review and approve the payment request',
        cta: {
          label: 'Approve Payment',
          action: 'approve',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [PaymentStatus.APPROVED]: {
      status: PaymentStatus.APPROVED,
      label: 'Approved',
      description: 'Payment has been approved',
      previousStep: {
        label: 'Pending Approval',
        description: 'Payment was approved by buyer',
      },
      nextAction: {
        label: 'Process Payment',
        description: 'Payment will be processed automatically',
      },
    },
    [PaymentStatus.PROCESSING]: {
      status: PaymentStatus.PROCESSING,
      label: 'Processing',
      description: 'Payment is being processed',
      previousStep: {
        label: 'Approved',
        description: 'Payment was approved and processing started',
      },
      nextAction: {
        label: 'Wait for Completion',
        description: 'Payment processing is in progress',
      },
    },
    [PaymentStatus.COMPLETED]: {
      status: PaymentStatus.COMPLETED,
      label: 'Completed',
      description: 'Payment has been completed',
      previousStep: {
        label: 'Processing',
        description: 'Payment was processed successfully',
      },
      nextAction: {
        label: 'No further action',
        description: 'This payment has been completed',
      },
      isTerminal: true,
    },
    [PaymentStatus.REJECTED]: {
      status: PaymentStatus.REJECTED,
      label: 'Rejected',
      description: 'Payment has been rejected',
      previousStep: {
        label: 'Pending Approval',
        description: 'Payment was rejected by buyer',
      },
      nextAction: {
        label: 'No further action',
        description: 'This payment has been rejected',
      },
      isTerminal: true,
    },
    [PaymentStatus.FAILED]: {
      status: PaymentStatus.FAILED,
      label: 'Failed',
      description: 'Payment processing failed',
      previousStep: {
        label: 'Processing',
        description: 'Payment processing encountered an error',
      },
      nextAction: {
        label: 'Retry Payment',
        description: 'Review and retry the payment',
        cta: {
          label: 'Retry Payment',
          action: 'retry',
          roles: [Role.BUYER, Role.ADMIN],
          variant: 'contained',
        },
      },
    },
    [PaymentStatus.CANCELLED]: {
      status: PaymentStatus.CANCELLED,
      label: 'Cancelled',
      description: 'Payment has been cancelled',
      previousStep: {
        label: 'Previous Status',
        description: 'Payment was cancelled',
      },
      nextAction: {
        label: 'No further action',
        description: 'This payment has been cancelled',
      },
      isTerminal: true,
    },
    [PaymentStatus.REFUNDED]: {
      status: PaymentStatus.REFUNDED,
      label: 'Refunded',
      description: 'Payment has been refunded',
      previousStep: {
        label: 'Completed',
        description: 'Payment was refunded',
      },
      nextAction: {
        label: 'No further action',
        description: 'This payment has been refunded',
      },
      isTerminal: true,
    },
  },
};

// All workflows
export const workflows: Record<EntityType, EntityWorkflow> = {
  rfq: rfqWorkflow,
  bid: bidWorkflow,
  contract: contractWorkflow,
  shipment: shipmentWorkflow,
  payment: paymentWorkflow,
};

// Helper functions
export const getWorkflowStep = (
  entityType: EntityType,
  status: string
): WorkflowStep | undefined => {
  const workflow = workflows[entityType];
  return workflow?.steps[status];
};

export const getNextAction = (
  entityType: EntityType,
  status: string
): WorkflowStep['nextAction'] | undefined => {
  const step = getWorkflowStep(entityType, status);
  return step?.nextAction;
};

export const getPreviousStep = (
  entityType: EntityType,
  status: string
): WorkflowStep['previousStep'] | undefined => {
  const step = getWorkflowStep(entityType, status);
  return step?.previousStep;
};

export const isTerminalStatus = (
  entityType: EntityType,
  status: string
): boolean => {
  const step = getWorkflowStep(entityType, status);
  return step?.isTerminal ?? false;
};
