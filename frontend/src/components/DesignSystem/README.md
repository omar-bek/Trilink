# TriLink Design System

Complete enterprise-grade design system for TriLink Government-Grade Sovereign Digital Trade Platform.

## Color Palette

### Primary Colors
- **Black Pearl** (`#0A1628`) - Primary background color
- **Vivid Cerulean** (`#00A8FF`) - Primary action color, highlights
- **Intense Azure** (`#0066CC`) - Secondary action color, highlights

### Neutral Colors
- **White** (`#FFFFFF`) - Tables & documents
- **Dark Silver** (`#6B7280`) - Secondary data
- **Sorrell Brown** (`#8B7355`) - Secondary data accents

## Typography

### Font Family
- **Primary**: Montserrat
- Fallback: System fonts (San Francisco, Segoe UI, Roboto)

### Hierarchy
- **Page Titles**: H1-H6 with clear weight hierarchy
- **KPIs**: Large, bold numbers (2.5rem, weight 700)
- **Tables**: Compact, readable (0.875rem)
- **Alerts**: Emphasized body text
- **Legal Text**: Small, readable (0.75rem)

## Components

### 1. EnterpriseTable

Sortable, filterable enterprise-grade data table.

```tsx
import { EnterpriseTable, Column } from '@/components/DesignSystem';

const columns: Column<DataType>[] = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'status', label: 'Status', filterable: true },
  { id: 'amount', label: 'Amount', sortable: true, render: (value) => `$${value}` },
];

<EnterpriseTable
  columns={columns}
  data={data}
  searchable
  onRowClick={(row) => console.log(row)}
/>
```

**Features:**
- Sortable columns
- Filterable columns
- Global search
- Row click handlers
- Loading states
- Empty states
- Sticky headers

### 2. KPICard

Key Performance Indicator cards with trends and icons.

```tsx
import { KPICard } from '@/components/DesignSystem';

<KPICard
  title="Total Revenue"
  value="$125,430"
  icon={<TrendingUpIcon />}
  trend={{ value: 12.5, label: "vs last month", isPositive: true }}
  color="primary"
  variant="default"
/>
```

**Variants:**
- `default` - Standard size
- `compact` - Smaller, dense layout
- `large` - Prominent display

### 3. StatusBadge

Status indicators with icons and color coding.

```tsx
import { StatusBadge } from '@/components/DesignSystem';

<StatusBadge
  status="success"
  label="Active"
  size="medium"
  variant="filled"
  showIcon
/>
```

**Status Types:**
- `success`, `completed`, `active`
- `error`, `cancelled`
- `warning`, `on-hold`
- `info`, `pending`, `in-progress`
- `draft`, `inactive`

**Variants:**
- `filled` - Solid background
- `outlined` - Border only
- `soft` - Light background

### 4. Timeline

Vertical or horizontal timeline component.

```tsx
import { Timeline, TimelineStep } from '@/components/DesignSystem';

const steps: TimelineStep[] = [
  {
    id: '1',
    label: 'Order Placed',
    status: 'completed',
    date: '2024-01-15',
    description: 'Order was placed successfully',
  },
  {
    id: '2',
    label: 'Processing',
    status: 'active',
    date: '2024-01-16',
  },
];

<Timeline
  steps={steps}
  orientation="vertical"
  showDates
  showDescriptions
/>
```

### 5. MultiStepForm

Multi-step form wizard with validation.

```tsx
import { MultiStepForm, FormStep } from '@/components/DesignSystem';

const steps: FormStep[] = [
  {
    id: 'step1',
    label: 'Personal Information',
    component: <PersonalInfoForm />,
    validation: async () => {
      // Validate step
      return true;
    },
  },
  {
    id: 'step2',
    label: 'Payment Details',
    component: <PaymentForm />,
  },
];

<MultiStepForm
  steps={steps}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### 6. RFQCard

Request for Quotation card component.

```tsx
import { RFQCard } from '@/components/DesignSystem';

<RFQCard
  id="rfq-123"
  title="Office Supplies Procurement"
  description="Annual office supplies procurement..."
  status="active"
  deadline={new Date('2024-02-01')}
  budget={50000}
  currency="USD"
  location="New York, USA"
  category="Office Supplies"
  buyer={{ name: "ABC Corp", isAnonymous: false }}
  bidCount={12}
  onView={() => {}}
  onBid={() => {}}
  variant="default"
/>
```

**Variants:**
- `default` - Standard card
- `compact` - Dense layout
- `detailed` - Extended information

### 7. NotificationPanel

Notification dropdown panel.

```tsx
import { NotificationPanel, Notification } from '@/components/DesignSystem';

const notifications: Notification[] = [
  {
    id: '1',
    title: 'New Bid Received',
    message: 'You have received a new bid on RFQ-123',
    type: 'info',
    timestamp: new Date(),
    read: false,
    action: {
      label: 'View Bid',
      onClick: () => {},
    },
  },
];

<NotificationPanel
  notifications={notifications}
  onMarkAsRead={(id) => {}}
  onMarkAllAsRead={() => {}}
  onDelete={(id) => {}}
/>
```

### 8. AnonymousChat

Anonymous chat module for secure communications.

```tsx
import { AnonymousChat, ChatMessage } from '@/components/DesignSystem';

const messages: ChatMessage[] = [
  {
    id: '1',
    message: 'Hello, I have a question about the RFQ',
    timestamp: new Date(),
    sender: 'other',
    senderName: 'Anonymous User',
  },
];

<AnonymousChat
  messages={messages}
  onSendMessage={(message, attachments) => {}}
  currentUserName="You"
  otherUserName="Anonymous User"
/>
```

### 9. Progress Bars

#### EscrowProgressBar

```tsx
import { EscrowProgressBar } from '@/components/DesignSystem';

<EscrowProgressBar
  currentStage="in-progress"
  amount={50000}
  currency="USD"
  milestones={[
    { id: '1', label: 'Milestone 1', completed: true, amount: 25000 },
    { id: '2', label: 'Milestone 2', completed: false, amount: 25000 },
  ]}
  showDetails
/>
```

#### PaymentProgressBar

```tsx
import { PaymentProgressBar } from '@/components/DesignSystem';

<PaymentProgressBar
  currentStage="processing"
  amount={1250.50}
  currency="USD"
  paymentMethod="Credit Card"
  transactionId="TXN-123456"
  showDetails
/>
```

## Usage

Import components from the design system:

```tsx
import {
  EnterpriseTable,
  KPICard,
  StatusBadge,
  Timeline,
  MultiStepForm,
  RFQCard,
  NotificationPanel,
  AnonymousChat,
  EscrowProgressBar,
  PaymentProgressBar,
} from '@/components/DesignSystem';
```

## Design Tokens

All design tokens are available through the theme:

```tsx
import { useTheme } from '@mui/material/styles';
import { designTokens } from '@/theme/theme';

const theme = useTheme();
// Access colors, typography, spacing, etc.
```

## Best Practices

1. **Consistency**: Always use design system components instead of custom implementations
2. **Accessibility**: All components follow WCAG 2.1 AA standards
3. **Responsive**: Components adapt to different screen sizes
4. **Performance**: Optimized for large datasets
5. **Type Safety**: Full TypeScript support with exported types

## Theme Integration

All components automatically use the TriLink theme:
- Black Pearl backgrounds
- Vivid Cerulean & Intense Azure for actions
- Montserrat typography
- Consistent spacing and borders
