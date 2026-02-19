# Government Analytics Dashboard Implementation

## Overview

Comprehensive Government Analytics dashboard with read-only access, KPIs, charts, filters, and export placeholders.

## Features

### ✅ Read-Only Access
- Government role required
- Admin role also has access
- Access control at route level
- Clear access denied message

### ✅ KPIs (Key Performance Indicators)
- Total Companies
- Total Contracts
- Contract Value
- Total Payments
- Completed Payments
- Pending Payments
- Total RFQs
- Escalated Disputes
- Trend indicators
- Currency formatting

### ✅ Charts
- Purchase Requests by Month (Bar)
- Contracts by Status (Pie)
- Payments by Status (Pie)
- Contracts by Month (Line)
- Payments by Month (Line)
- Companies by Type (Pie)
- Disputes by Type (Bar)
- Chart placeholders ready for integration

### ✅ Filters
- Date range (Start Date, End Date)
- Company Type filter
- Status filter
- Clear filters button
- Active filter indicator
- Collapsible filter panel

### ✅ Export Placeholders
- PDF export button
- Excel export button
- CSV export button
- Export functionality placeholder
- Ready for implementation

## Components

### AnalyticsChart
Chart component wrapper for analytics visualizations.

```tsx
<AnalyticsChart
  title="Purchase Requests by Month"
  type="bar"
  data={chartData}
  loading={isLoading}
/>
```

**Props:**
- `title: string` - Chart title
- `type: 'bar' | 'line' | 'pie'` - Chart type
- `data?: any` - Chart data
- `loading?: boolean` - Loading state

### ExportButton
Export button component for different formats.

```tsx
<ExportButton
  format="pdf"
  onClick={handleExport}
  disabled={false}
/>
```

**Formats:**
- PDF
- Excel
- CSV

## Pages

### GovernmentAnalytics
- Route: `/analytics/government`
- Features: KPIs, charts, filters, export
- Access: Government role only

## API Integration

### Service (`analytics.service.ts`)
- `getGovernmentAnalytics(filters?)` - Get government analytics with optional filters

### React Query Hook (`useAnalytics.ts`)
- `useGovernmentAnalytics(filters?)` - Analytics query with filters
- Auto-refetches every 10 minutes
- 5-minute stale time

## Usage Examples

### Government Analytics Dashboard

```tsx
import { GovernmentAnalytics } from '@/pages/Analytics';

<ProtectedRoute requiredRole={Role.GOVERNMENT}>
  <MainLayout>
    <GovernmentAnalytics />
  </MainLayout>
</ProtectedRoute>
```

### Using Filters

```tsx
const [filters, setFilters] = useState<AnalyticsFilters>({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  companyType: 'supplier',
});

const { data } = useGovernmentAnalytics(filters);
```

## KPIs Displayed

1. **Total Companies** - Active companies on platform
2. **Total Contracts** - All contracts created
3. **Contract Value** - Total value of all contracts (with trend)
4. **Total Payments** - Total payment amount (with trend)
5. **Completed Payments** - Successfully completed payments
6. **Pending Payments** - Payments awaiting approval/processing
7. **Total RFQs** - All RFQs created
8. **Escalated Disputes** - Disputes escalated to government

## Charts Available

1. **Purchase Requests by Month** - Bar chart showing monthly PR counts
2. **Contracts by Status** - Pie chart showing contract status distribution
3. **Payments by Status** - Pie chart showing payment status distribution
4. **Contracts by Month** - Line chart showing contract trends over time
5. **Payments by Month** - Line chart showing payment trends over time
6. **Companies by Type** - Pie chart showing company type distribution
7. **Disputes by Type** - Bar chart showing dispute types

## Filter Options

- **Date Range**: Start date and end date
- **Company Type**: Filter by company type (Buyer, Supplier, Logistics, etc.)
- **Status**: Filter by status (for various entities)
- **Clear Filters**: Reset all filters

## Export Functionality

### Current Implementation
- Export buttons for PDF, Excel, CSV
- Placeholder functionality
- Ready for integration with export libraries

### Future Implementation
- PDF: Use libraries like `jspdf` or `react-pdf`
- Excel: Use libraries like `xlsx` or `exceljs`
- CSV: Generate CSV from data

## Summary Statistics

Three summary cards showing:
1. **Transaction Summary**: Purchase Requests, Bids, Shipments, Disputes
2. **Payment Summary**: Total, Completed, Pending, Completion Rate
3. **Platform Health**: Active Companies, Contract Value, Dispute Resolution Rate, Escalated Disputes

## Role-Based Access

### Government
- Full read-only access
- View all analytics
- Export capabilities
- Filter all data

### Admin
- Full read-only access
- Same as Government

### Other Roles
- Access denied
- Clear error message

## Routes

- `GET /api/analytics/government` - Get government analytics
- Query params: `startDate`, `endDate`, `companyType`, `status`

## Best Practices

1. **Read-Only**: All data is read-only, no edit capabilities
2. **Auto-Refresh**: Data refreshes every 10 minutes
3. **Filtering**: Use filters to reduce data load
4. **Export**: Export functionality ready for implementation
5. **Error Handling**: Clear error messages
6. **Loading States**: Show loading indicators

## Future Enhancements

- [ ] Real chart library integration (Chart.js, Recharts, etc.)
- [ ] PDF export implementation
- [ ] Excel export implementation
- [ ] CSV export implementation
- [ ] Custom date range picker
- [ ] Advanced filters
- [ ] Drill-down capabilities
- [ ] Comparison views (period over period)
- [ ] Real-time updates
- [ ] Scheduled reports
- [ ] Email report delivery
- [ ] Custom dashboard configuration
- [ ] Saved filter presets
- [ ] Data refresh controls
- [ ] Print functionality
