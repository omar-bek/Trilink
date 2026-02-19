# Dashboard Implementation

## Overview

The TriLink dashboard provides role-based KPIs, recent activity feeds, and analytics widgets tailored to each user's role.

## Features

### ✅ KPI Cards
- Role-specific metrics
- Clickable navigation to detail pages
- Loading skeletons
- Trend indicators
- Color-coded by category

### ✅ Recent Activity
- Real-time activity feed
- Activity type icons
- Status badges
- Timestamp formatting
- Loading states

### ✅ Role-Based Widgets
- Custom widgets per role
- Chart placeholders ready for integration
- Responsive grid layout
- Loading states

### ✅ Skeleton Loaders
- Page-level skeletons
- Component-level skeletons
- Smooth loading transitions

### ✅ Charts Placeholders
- Bar chart placeholders
- Line chart placeholders
- Pie chart placeholders
- Ready for chart library integration

## Components

### KPICard

Displays a single KPI metric with icon, value, and optional trend.

```tsx
import { KPICard } from '@/components/Dashboard/KPICard';

<KPICard
  title="Purchase Requests"
  value={42}
  icon={<ShoppingCart />}
  color="primary"
  trend={{ value: 12.5, label: 'vs last month' }}
  onClick={() => navigate('/purchase-requests')}
/>
```

**Props:**
- `title: string` - KPI title
- `value: string | number` - KPI value
- `icon: ReactNode` - Icon component
- `color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'`
- `trend?: { value: number; label: string }` - Trend indicator
- `loading?: boolean` - Loading state
- `onClick?: () => void` - Click handler

### RecentActivity

Displays a list of recent activities with icons and status badges.

```tsx
import { RecentActivity } from '@/components/Dashboard/RecentActivity';

<RecentActivity
  activities={activities}
  loading={isLoading}
  maxItems={10}
/>
```

**Props:**
- `activities: RecentActivity[]` - Array of activities
- `loading?: boolean` - Loading state
- `maxItems?: number` - Maximum items to display

### ChartPlaceholder

Placeholder component for charts, ready for chart library integration.

```tsx
import { ChartPlaceholder } from '@/components/Dashboard/ChartPlaceholder';

<ChartPlaceholder
  title="Purchase Requests by Status"
  type="pie"
  height={300}
  loading={isLoading}
  data={chartData}
/>
```

**Props:**
- `title: string` - Chart title
- `type?: 'bar' | 'line' | 'pie'` - Chart type
- `height?: number` - Chart height
- `loading?: boolean` - Loading state
- `data?: any` - Chart data

### RoleBasedWidgets

Displays role-specific widgets and charts.

```tsx
import { RoleBasedWidgets } from '@/components/Dashboard/RoleBasedWidgets';

<RoleBasedWidgets
  kpis={dashboardData?.charts}
  loading={isLoading}
/>
```

**Props:**
- `kpis?: any` - KPI data
- `loading?: boolean` - Loading state

## Role-Specific Features

### Buyer Dashboard
- Purchase Requests KPI
- RFQs Overview
- Contracts KPI
- Purchase Requests by Status chart
- RFQs Overview chart
- Contract Value Trend chart

### Supplier Dashboard
- Bids KPI
- RFQs Overview
- Contracts KPI
- Bid Acceptance Rate chart
- Active RFQs chart
- Bid Performance chart

### Logistics Dashboard
- Active Shipments KPI
- Shipments by Status chart
- GPS Tracking Overview chart
- Delivery Performance chart

### Government Dashboard
- Platform Overview chart
- Transaction Volume chart
- Dispute Resolution Rate chart
- All platform KPIs

### Admin Dashboard
- All KPIs
- User Growth chart
- Company Distribution chart
- System Activity chart
- Platform Analytics chart
- Total Disputes KPI
- Platform Growth KPI

## Data Fetching

### Dashboard Service

```typescript
import { dashboardService } from '@/services/dashboard.service';

// Get company dashboard data
const data = await dashboardService.getDashboardData();

// Get government dashboard data
const govData = await dashboardService.getGovernmentDashboard();

// Get recent activity
const activity = await dashboardService.getRecentActivity(10);
```

### React Query Hook

```tsx
import { useDashboard } from '@/hooks/useDashboard';

const {
  dashboardData,
  recentActivity,
  isLoading,
  isError,
  refetch,
} = useDashboard();
```

## API Endpoints

The dashboard uses these backend endpoints:

- `GET /api/analytics/company` - Company analytics (Buyer, Supplier, etc.)
- `GET /api/analytics/government` - Government analytics
- `GET /api/audit?limit=10` - Recent activity

## Customization

### Adding New KPIs

Edit `src/pages/Dashboard/Dashboard.tsx`:

```tsx
const kpiCards = [
  {
    title: 'New Metric',
    value: 123,
    icon: <NewIcon />,
    color: 'primary' as const,
    path: '/new-page',
  },
  // ... existing KPIs
];
```

### Adding Role-Specific Widgets

Edit `src/components/Dashboard/RoleBasedWidgets.tsx`:

```tsx
if (role === Role.NEW_ROLE) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ChartPlaceholder title="Custom Widget" />
      </Grid>
    </Grid>
  );
}
```

### Integrating Chart Library

Replace `ChartPlaceholder` with actual chart components:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<Card>
  <CardHeader title="Chart Title" />
  <CardContent>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke="#8884d8" />
    </LineChart>
  </CardContent>
</Card>
```

## Loading States

All components support loading states:

```tsx
<KPICard
  title="Metric"
  value={0}
  icon={<Icon />}
  loading={isLoading}
/>
```

## Best Practices

1. **Use React Query** for data fetching and caching
2. **Show loading skeletons** during data fetch
3. **Handle errors gracefully** with error boundaries
4. **Make KPIs clickable** to navigate to detail pages
5. **Use role-based filtering** for widgets
6. **Keep widgets responsive** with Material-UI Grid
7. **Format numbers** appropriately (currency, percentages)
8. **Show empty states** when no data available

## Future Enhancements

- [ ] Real-time updates with WebSocket
- [ ] Customizable dashboard layout
- [ ] Export dashboard data
- [ ] Date range filters
- [ ] Comparison views (month-over-month)
- [ ] Drill-down capabilities
- [ ] Interactive charts
- [ ] Dashboard widgets drag-and-drop
- [ ] Saved dashboard views
- [ ] Email reports

## Chart Library Integration

To integrate a chart library (e.g., Recharts, Chart.js):

1. Install the library:
```bash
npm install recharts
```

2. Create chart components:
```tsx
// src/components/Dashboard/Charts/LineChart.tsx
import { LineChart as RechartsLineChart, ... } from 'recharts';

export const LineChart = ({ data, ...props }) => {
  return (
    <RechartsLineChart data={data} {...props}>
      {/* Chart configuration */}
    </RechartsLineChart>
  );
};
```

3. Replace ChartPlaceholder with actual charts:
```tsx
<LineChart data={dashboardData?.charts?.purchaseRequestsByMonth} />
```
