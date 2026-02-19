/**
 * Service Provider Configuration
 * 
 * Data-driven configuration for service provider types
 * Supports modular, configurable service dashboards
 */

import {
  Inventory,
  VerifiedUser,
  Warehouse,
  Security,
  AccountBalance,
} from '@mui/icons-material';

// ============================================================================
// SERVICE TYPES
// ============================================================================

export enum ServiceType {
  PACKAGING_LABELING = 'packaging_labeling',
  INSPECTION_CERTIFICATION = 'inspection_certification',
  WAREHOUSING = 'warehousing',
  INSURANCE = 'insurance',
  FINANCING = 'financing',
}

// ============================================================================
// SERVICE TYPE CONFIGURATION
// ============================================================================

export interface ServiceTypeConfig {
  id: ServiceType;
  name: string;
  displayName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  
  // Workflow configuration
  workflow: {
    hasRFQInbox: boolean;
    hasBidSubmission: boolean;
    hasNegotiation: boolean;
    hasContractAcceptance: boolean;
  };
  
  // Service-specific fields
  fields: ServiceField[];
  
  // Bid submission fields
  bidFields: BidField[];
  
  // Metrics/KPIs specific to this service
  metrics: ServiceMetric[];
}

export interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'file';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  serviceSpecific?: boolean; // Only shown for this service type
}

export interface BidField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
  };
}

export interface ServiceMetric {
  id: string;
  label: string;
  type: 'count' | 'amount' | 'percentage' | 'duration';
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

// ============================================================================
// SERVICE TYPE DEFINITIONS
// ============================================================================

export const SERVICE_TYPE_CONFIGS: Record<ServiceType, ServiceTypeConfig> = {
  [ServiceType.PACKAGING_LABELING]: {
    id: ServiceType.PACKAGING_LABELING,
    name: 'packaging_labeling',
    displayName: 'Packaging & Labeling',
    description: 'Professional packaging and labeling services for trade compliance',
    icon: <Inventory />,
    color: '#007BA7',
    workflow: {
      hasRFQInbox: true,
      hasBidSubmission: true,
      hasNegotiation: true,
      hasContractAcceptance: true,
    },
    fields: [
      {
        id: 'packageType',
        label: 'Package Type',
        type: 'select',
        required: true,
        options: [
          { value: 'carton', label: 'Carton' },
          { value: 'pallet', label: 'Pallet' },
          { value: 'container', label: 'Container' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      {
        id: 'labelingRequirements',
        label: 'Labeling Requirements',
        type: 'textarea',
        required: true,
        placeholder: 'Specify labeling requirements (languages, standards, etc.)',
      },
      {
        id: 'complianceStandards',
        label: 'Compliance Standards',
        type: 'select',
        required: true,
        options: [
          { value: 'iso', label: 'ISO Standards' },
          { value: 'fda', label: 'FDA Standards' },
          { value: 'ce', label: 'CE Marking' },
          { value: 'custom', label: 'Custom Standards' },
        ],
      },
      {
        id: 'volume',
        label: 'Volume (units)',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
    ],
    bidFields: [
      {
        id: 'pricePerUnit',
        label: 'Price per Unit (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'totalPrice',
        label: 'Total Price (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'packagingTime',
        label: 'Packaging Time (days)',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
      {
        id: 'qualityAssurance',
        label: 'Quality Assurance Included',
        type: 'boolean',
        required: false,
      },
      {
        id: 'additionalServices',
        label: 'Additional Services',
        type: 'textarea',
        required: false,
        placeholder: 'Custom packaging, special handling, etc.',
      },
    ],
    metrics: [
      { id: 'totalRFQs', label: 'Total RFQs', type: 'count', aggregation: 'count' },
      { id: 'activeBids', label: 'Active Bids', type: 'count', aggregation: 'count' },
      { id: 'winRate', label: 'Win Rate', type: 'percentage', aggregation: 'avg' },
      { id: 'avgResponseTime', label: 'Avg Response Time', type: 'duration', aggregation: 'avg' },
    ],
  },

  [ServiceType.INSPECTION_CERTIFICATION]: {
    id: ServiceType.INSPECTION_CERTIFICATION,
    name: 'inspection_certification',
    displayName: 'Inspection & Certification',
    description: 'Quality inspection and certification services',
    icon: <VerifiedUser />,
    color: '#10B981',
    workflow: {
      hasRFQInbox: true,
      hasBidSubmission: true,
      hasNegotiation: true,
      hasContractAcceptance: true,
    },
    fields: [
      {
        id: 'inspectionType',
        label: 'Inspection Type',
        type: 'select',
        required: true,
        options: [
          { value: 'pre_shipment', label: 'Pre-Shipment Inspection' },
          { value: 'during_production', label: 'During Production' },
          { value: 'final', label: 'Final Inspection' },
          { value: 'container', label: 'Container Loading' },
        ],
      },
      {
        id: 'certificationType',
        label: 'Certification Type',
        type: 'select',
        required: true,
        options: [
          { value: 'coo', label: 'Certificate of Origin' },
          { value: 'coa', label: 'Certificate of Analysis' },
          { value: 'health', label: 'Health Certificate' },
          { value: 'phytosanitary', label: 'Phytosanitary Certificate' },
          { value: 'custom', label: 'Custom Certificate' },
        ],
      },
      {
        id: 'standards',
        label: 'Standards Required',
        type: 'textarea',
        required: true,
        placeholder: 'ISO, ASTM, DIN, etc.',
      },
      {
        id: 'sampleSize',
        label: 'Sample Size',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
    ],
    bidFields: [
      {
        id: 'inspectionFee',
        label: 'Inspection Fee (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'certificationFee',
        label: 'Certification Fee (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'inspectionDuration',
        label: 'Inspection Duration (days)',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
      {
        id: 'certificateValidity',
        label: 'Certificate Validity (months)',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
      {
        id: 'onSiteInspection',
        label: 'On-Site Inspection Available',
        type: 'boolean',
        required: false,
      },
    ],
    metrics: [
      { id: 'totalRFQs', label: 'Total RFQs', type: 'count', aggregation: 'count' },
      { id: 'certificationsIssued', label: 'Certifications Issued', type: 'count', aggregation: 'count' },
      { id: 'avgInspectionTime', label: 'Avg Inspection Time', type: 'duration', aggregation: 'avg' },
      { id: 'complianceRate', label: 'Compliance Rate', type: 'percentage', aggregation: 'avg' },
    ],
  },

  [ServiceType.WAREHOUSING]: {
    id: ServiceType.WAREHOUSING,
    name: 'warehousing',
    displayName: 'Warehousing',
    description: 'Storage and inventory management services',
    icon: <Warehouse />,
    color: '#F59E0B',
    workflow: {
      hasRFQInbox: true,
      hasBidSubmission: true,
      hasNegotiation: true,
      hasContractAcceptance: true,
    },
    fields: [
      {
        id: 'storageType',
        label: 'Storage Type',
        type: 'select',
        required: true,
        options: [
          { value: 'dry', label: 'Dry Storage' },
          { value: 'cold', label: 'Cold Storage' },
          { value: 'frozen', label: 'Frozen Storage' },
          { value: 'hazardous', label: 'Hazardous Materials' },
          { value: 'custom', label: 'Custom Requirements' },
        ],
      },
      {
        id: 'storageDuration',
        label: 'Storage Duration (months)',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
      {
        id: 'volume',
        label: 'Volume (cubic meters)',
        type: 'number',
        required: true,
        validation: { min: 0.1 },
      },
      {
        id: 'specialRequirements',
        label: 'Special Requirements',
        type: 'textarea',
        required: false,
        placeholder: 'Security, handling, insurance, etc.',
      },
    ],
    bidFields: [
      {
        id: 'monthlyStorageFee',
        label: 'Monthly Storage Fee (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'handlingFee',
        label: 'Handling Fee (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'insuranceIncluded',
        label: 'Insurance Included',
        type: 'boolean',
        required: false,
      },
      {
        id: 'securityLevel',
        label: 'Security Level',
        type: 'select',
        required: true,
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'enhanced', label: 'Enhanced' },
          { value: 'maximum', label: 'Maximum' },
        ],
      },
      {
        id: 'inventoryManagement',
        label: 'Inventory Management Included',
        type: 'boolean',
        required: false,
      },
    ],
    metrics: [
      { id: 'totalRFQs', label: 'Total RFQs', type: 'count', aggregation: 'count' },
      { id: 'storageCapacity', label: 'Storage Capacity (m³)', type: 'amount', aggregation: 'sum' },
      { id: 'utilizationRate', label: 'Utilization Rate', type: 'percentage', aggregation: 'avg' },
      { id: 'avgStorageDuration', label: 'Avg Storage Duration', type: 'duration', aggregation: 'avg' },
    ],
  },

  [ServiceType.INSURANCE]: {
    id: ServiceType.INSURANCE,
    name: 'insurance',
    displayName: 'Insurance',
    description: 'Trade and cargo insurance services',
    icon: <Security />,
    color: '#EF4444',
    workflow: {
      hasRFQInbox: true,
      hasBidSubmission: true,
      hasNegotiation: true,
      hasContractAcceptance: true,
    },
    fields: [
      {
        id: 'insuranceType',
        label: 'Insurance Type',
        type: 'select',
        required: true,
        options: [
          { value: 'cargo', label: 'Cargo Insurance' },
          { value: 'liability', label: 'Liability Insurance' },
          { value: 'marine', label: 'Marine Insurance' },
          { value: 'transit', label: 'Transit Insurance' },
          { value: 'comprehensive', label: 'Comprehensive' },
        ],
      },
      {
        id: 'coverageAmount',
        label: 'Coverage Amount (AED)',
        type: 'number',
        required: true,
        validation: { min: 1000 },
      },
      {
        id: 'coveragePeriod',
        label: 'Coverage Period (months)',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
      {
        id: 'riskLevel',
        label: 'Risk Level',
        type: 'select',
        required: true,
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
    ],
    bidFields: [
      {
        id: 'premium',
        label: 'Premium (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'deductible',
        label: 'Deductible (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'coverageDetails',
        label: 'Coverage Details',
        type: 'textarea',
        required: true,
        placeholder: 'Detailed coverage terms and conditions',
      },
      {
        id: 'claimsProcess',
        label: 'Claims Process',
        type: 'textarea',
        required: true,
        placeholder: 'How to file claims, processing time, etc.',
      },
    ],
    metrics: [
      { id: 'totalRFQs', label: 'Total RFQs', type: 'count', aggregation: 'count' },
      { id: 'totalCoverage', label: 'Total Coverage (AED)', type: 'amount', aggregation: 'sum' },
      { id: 'claimsRatio', label: 'Claims Ratio', type: 'percentage', aggregation: 'avg' },
      { id: 'avgPremium', label: 'Avg Premium (AED)', type: 'amount', aggregation: 'avg' },
    ],
  },

  [ServiceType.FINANCING]: {
    id: ServiceType.FINANCING,
    name: 'financing',
    displayName: 'Financing',
    description: 'Trade financing and credit services',
    icon: <AccountBalance />,
    color: '#8B5CF6',
    workflow: {
      hasRFQInbox: true,
      hasBidSubmission: true,
      hasNegotiation: true,
      hasContractAcceptance: true,
    },
    fields: [
      {
        id: 'financingType',
        label: 'Financing Type',
        type: 'select',
        required: true,
        options: [
          { value: 'invoice', label: 'Invoice Financing' },
          { value: 'purchase_order', label: 'Purchase Order Financing' },
          { value: 'trade_credit', label: 'Trade Credit' },
          { value: 'letter_of_credit', label: 'Letter of Credit' },
          { value: 'supply_chain', label: 'Supply Chain Financing' },
        ],
      },
      {
        id: 'financingAmount',
        label: 'Financing Amount (AED)',
        type: 'number',
        required: true,
        validation: { min: 10000 },
      },
      {
        id: 'financingTerm',
        label: 'Financing Term (months)',
        type: 'number',
        required: true,
        validation: { min: 1, max: 60 },
      },
      {
        id: 'purpose',
        label: 'Purpose',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the purpose of financing',
      },
    ],
    bidFields: [
      {
        id: 'interestRate',
        label: 'Interest Rate (%)',
        type: 'number',
        required: true,
        validation: { min: 0, max: 100 },
      },
      {
        id: 'processingFee',
        label: 'Processing Fee (AED)',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'repaymentTerms',
        label: 'Repayment Terms',
        type: 'textarea',
        required: true,
        placeholder: 'Monthly, quarterly, bullet payment, etc.',
      },
      {
        id: 'collateralRequired',
        label: 'Collateral Required',
        type: 'boolean',
        required: false,
      },
      {
        id: 'approvalTime',
        label: 'Approval Time (days)',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
    ],
    metrics: [
      { id: 'totalRFQs', label: 'Total RFQs', type: 'count', aggregation: 'count' },
      { id: 'totalFinanced', label: 'Total Financed (AED)', type: 'amount', aggregation: 'sum' },
      { id: 'avgInterestRate', label: 'Avg Interest Rate (%)', type: 'percentage', aggregation: 'avg' },
      { id: 'approvalRate', label: 'Approval Rate', type: 'percentage', aggregation: 'avg' },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getServiceTypeConfig(serviceType: ServiceType): ServiceTypeConfig {
  return SERVICE_TYPE_CONFIGS[serviceType];
}

export function getAllServiceTypes(): ServiceTypeConfig[] {
  return Object.values(SERVICE_TYPE_CONFIGS);
}

export function getServiceTypeByRFQType(rfqType: string): ServiceType | null {
  const mapping: Record<string, ServiceType> = {
    'Service Provider': ServiceType.PACKAGING_LABELING, // Default, can be extended
  };
  return mapping[rfqType] || null;
}