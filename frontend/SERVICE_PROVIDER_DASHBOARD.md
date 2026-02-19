# Service Provider Dashboard Documentation

## Overview

The Service Provider Dashboard is a modular, configurable system designed to support multiple service types with workflow-oriented interfaces. It provides a unified experience for service providers to manage RFQs, submit bids, negotiate, and accept contracts.

## Architecture

### Core Principles

1. **Modular Design** - Each service type is independently configurable
2. **Data-Driven** - Service configurations drive UI and behavior
3. **Workflow-Oriented** - Clear stages: RFQ → Bid → Negotiation → Contract
4. **Reusable Components** - Shared workflow components across service types

### Service Types Supported

1. **Packaging & Labeling** - Professional packaging and labeling services
2. **Inspection & Certification** - Quality inspection and certification
3. **Warehousing** - Storage and inventory management
4. **Insurance** - Trade and cargo insurance
5. **Financing** - Trade financing and credit services

## Component Structure

```
frontend/src/
├── config/
│   └── serviceProvider.ts          # Service type configurations
├── components/
│   └── ServiceProvider/
│       ├── RFQInbox.tsx            # RFQ inbox component
│       ├── BidSubmission.tsx       # Bid submission form
│       ├── NegotiationRoom.tsx    # Real-time negotiation
│       └── ContractAcceptance.tsx  # Contract review & acceptance
└── pages/
    └── ServiceProvider/
        └── ServiceProviderDashboard.tsx  # Main dashboard
```

## Service Type Configuration

Each service type is defined in `config/serviceProvider.ts` with:

### Configuration Structure

```typescript
interface ServiceTypeConfig {
  id: ServiceType;
  name: string;
  displayName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  
  workflow: {
    hasRFQInbox: boolean;
    hasBidSubmission: boolean;
    hasNegotiation: boolean;
    hasContractAcceptance: boolean;
  };
  
  fields: ServiceField[];      // RFQ-specific fields
  bidFields: BidField[];       // Bid submission fields
  metrics: ServiceMetric[];     // Service-specific KPIs
}
```

### Example: Packaging & Labeling

```typescript
{
  id: ServiceType.PACKAGING_LABELING,
  displayName: 'Packaging & Labeling',
  workflow: {
    hasRFQInbox: true,
    hasBidSubmission: true,
    hasNegotiation: true,
    hasContractAcceptance: true,
  },
  fields: [
    { id: 'packageType', label: 'Package Type', type: 'select', ... },
    { id: 'labelingRequirements', label: 'Labeling Requirements', type: 'textarea', ... },
  ],
  bidFields: [
    { id: 'pricePerUnit', label: 'Price per Unit', type: 'number', ... },
    { id: 'packagingTime', label: 'Packaging Time', type: 'number', ... },
  ],
}
```

## Workflow Components

### 1. RFQ Inbox

**Component:** `RFQInbox`

**Features:**
- Filter RFQs by status (All, Open, Closed)
- Service type filtering
- Sortable columns
- Click to view RFQ details
- Status badges

**Usage:**
```tsx
<RFQInbox
  serviceType={ServiceType.PACKAGING_LABELING}
  serviceConfig={serviceConfig}
/>
```

### 2. Bid Submission

**Component:** `BidSubmission`

**Features:**
- Dynamic form based on service configuration
- Service-specific bid fields
- Validation based on field requirements
- RFQ context display
- Auto-populated defaults

**Usage:**
```tsx
<BidSubmission
  serviceType={ServiceType.PACKAGING_LABELING}
  serviceConfig={serviceConfig}
  rfqId="rfq-123"
/>
```

**Service-Specific Fields:**
- Packaging: `pricePerUnit`, `packagingTime`, `qualityAssurance`
- Inspection: `inspectionFee`, `certificationFee`, `inspectionDuration`
- Warehousing: `monthlyStorageFee`, `handlingFee`, `securityLevel`
- Insurance: `premium`, `deductible`, `coverageDetails`
- Financing: `interestRate`, `processingFee`, `repaymentTerms`

### 3. Negotiation Room

**Component:** `NegotiationRoom`

**Features:**
- Real-time messaging interface
- Message history
- File attachments support
- Bid/Contract context
- Service provider perspective

**Usage:**
```tsx
<NegotiationRoom
  serviceType={ServiceType.PACKAGING_LABELING}
  serviceConfig={serviceConfig}
  bidId="bid-123"
/>
```

### 4. Contract Acceptance

**Component:** `ContractAcceptance`

**Features:**
- Contract details display
- Terms & conditions review
- Accept/Reject actions
- Contract PDF download
- Status tracking

**Usage:**
```tsx
<ContractAcceptance
  serviceType={ServiceType.PACKAGING_LABELING}
  serviceConfig={serviceConfig}
  contractId="contract-123"
/>
```

## Main Dashboard

**Component:** `ServiceProviderDashboard`

**Features:**
- Service type selection tabs
- Workflow stage navigation
- KPI cards (RFQs, Bids, Contracts, Win Rate)
- Service information display
- Dynamic workflow component rendering

**URL Parameters:**
- `serviceType` - Selected service type
- `stage` - Current workflow stage

**Example URL:**
```
/service-provider?serviceType=packaging_labeling&stage=rfq-inbox
```

## Adding a New Service Type

### Step 1: Define Service Type

```typescript
export enum ServiceType {
  // ... existing types
  NEW_SERVICE = 'new_service',
}
```

### Step 2: Create Configuration

```typescript
export const SERVICE_TYPE_CONFIGS: Record<ServiceType, ServiceTypeConfig> = {
  // ... existing configs
  [ServiceType.NEW_SERVICE]: {
    id: ServiceType.NEW_SERVICE,
    name: 'new_service',
    displayName: 'New Service',
    description: 'Description of new service',
    icon: <NewServiceIcon />,
    color: '#HEX_COLOR',
    workflow: {
      hasRFQInbox: true,
      hasBidSubmission: true,
      hasNegotiation: true,
      hasContractAcceptance: true,
    },
    fields: [
      // Service-specific RFQ fields
    ],
    bidFields: [
      // Service-specific bid fields
    ],
    metrics: [
      // Service-specific metrics
    ],
  },
};
```

### Step 3: Add to Navigation

Update navigation configuration to include the new service type.

## Data Flow

### RFQ → Bid → Negotiation → Contract

1. **RFQ Inbox**
   - Service provider views available RFQs
   - Filters by service type and status
   - Selects RFQ to respond

2. **Bid Submission**
   - Service provider creates bid
   - Fills service-specific fields
   - Submits bid for evaluation

3. **Negotiation**
   - Buyer and service provider negotiate
   - Real-time messaging
   - Terms adjustment

4. **Contract Acceptance**
   - Service provider reviews contract
   - Accepts or rejects
   - Contract becomes active

## Integration Points

### Services Used

- `rfqService` - RFQ data fetching
- `bidService` - Bid creation and management
- `contractService` - Contract operations
- `dashboardService` - Dashboard metrics

### Hooks Used

- `useRFQ` - Single RFQ data
- `useCreateBid` - Bid creation mutation
- `useQuery` - Data fetching
- `useMutation` - Data mutations

## Styling

All components use the TriLink design system:
- Enterprise-grade design tokens
- Consistent spacing and typography
- Service-specific color schemes
- Responsive grid layouts

## Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for live RFQ updates
   - Real-time negotiation messaging

2. **Advanced Filtering**
   - Multi-criteria RFQ filtering
   - Saved filter presets

3. **Analytics**
   - Service-specific analytics dashboards
   - Performance metrics tracking

4. **Notifications**
   - RFQ alerts
   - Bid status updates
   - Contract notifications

5. **Bulk Operations**
   - Bulk bid submission
   - Multiple contract acceptance

## Testing

### Component Testing

Each workflow component should be tested for:
- Service type configuration handling
- Form validation
- Data fetching and mutations
- Error states

### Integration Testing

Test complete workflows:
- RFQ → Bid → Negotiation → Contract
- Service type switching
- Workflow stage navigation

## Support

For questions or issues:
- Review component documentation
- Check service type configurations
- Verify API endpoints
- Check design system tokens