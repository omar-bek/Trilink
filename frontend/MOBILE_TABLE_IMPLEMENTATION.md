# Mobile-First Table Implementation Guide

## Overview

This document provides comprehensive guidelines for implementing mobile-safe data tables across the application. All tables automatically adapt to mobile devices without horizontal scrolling or hidden data.

## 1. Decision Rules: Table vs Card vs List

### When to Use ResponsiveTable

Use `ResponsiveTable` when:
- **Data has 3+ columns** that need comparison
- **Tabular data structure** (rows and columns)
- **Sorting/filtering** is important
- **Desktop users** need side-by-side comparison
- **Mobile users** need full data access

**Examples:**
- Bid lists (price, status, AI score, delivery date)
- Contract lists (amount, status, parties, dates)
- Payment lists (amount, status, due date, milestone)
- RFQ lists (budget, status, deadline, type)

### When to Use Card Layout Only

Use card layout (Grid + custom cards) when:
- **Rich content** per item (images, complex nested data)
- **No comparison needed** between items
- **Single-column focus** (details page, feed)
- **Custom interactions** per card

**Examples:**
- Dashboard widgets
- Activity feeds
- Product catalogs with images

### When to Use List Layout

Use list layout when:
- **Simple key-value pairs**
- **Minimal data** (2-3 fields max)
- **Navigation-focused** (menu items, notifications)
- **No tabular structure**

**Examples:**
- Navigation menus
- Notification lists
- Simple settings lists

## 2. Mobile Card Layout Schema

### Layout Structure

```
┌─────────────────────────────────┐
│  [High Priority Fields]         │
│  ───────────────────────────   │
│  Field 1: Value 1               │
│  Field 2: Value 2               │
│  ───────────────────────────   │
│  Field 3: Value 3    [Action]  │
│  Field 4: Value 4               │
│  Field 5: Value 5               │
└─────────────────────────────────┘
```

### Priority Levels

1. **High Priority** (Always visible, prominent)
   - Primary identifier (ID, name, title)
   - Status badge
   - Key metric (price, amount)
   - Primary action button

2. **Medium Priority** (Visible, compact)
   - Secondary metrics
   - Dates (delivery, due date)
   - Counts (items, parties)

3. **Low Priority** (Visible, minimal)
   - Additional metadata
   - Notes, descriptions (truncated)
   - Less critical dates

### Visual Hierarchy

- **High Priority**: Full-width, larger text, prominent spacing
- **Medium/Low Priority**: Two-column layout (label: value), smaller text
- **Divider**: Between high and other priorities for visual separation

## 3. Column Prioritization Strategy

### Priority Assignment Rules

#### High Priority
- **Identifiers**: ID, name, title (what is it?)
- **Status**: Current state (status badge)
- **Primary Metric**: Price, amount, score (key decision factor)
- **Actions**: Primary action button

#### Medium Priority
- **Secondary Metrics**: Counts, percentages, ratings
- **Important Dates**: Delivery date, due date, deadline
- **Categories**: Type, category tags

#### Low Priority
- **Metadata**: Creation date, last updated
- **Descriptions**: Long text (truncated)
- **Optional Fields**: Notes, comments
- **Less Critical Dates**: End dates, expiry dates

### Example: Bid Table

```typescript
{
  id: 'id',
  priority: 'high',        // What bid is this?
},
{
  id: 'status',
  priority: 'high',        // Current state
},
{
  id: 'price',
  priority: 'high',        // Key decision factor
},
{
  id: 'aiScore',
  priority: 'medium',      // Secondary metric
},
{
  id: 'deliveryDate',
  priority: 'medium',      // Important date
},
{
  id: 'paymentTerms',
  priority: 'low',         // Metadata
},
{
  id: 'validity',
  priority: 'low',         // Less critical date
}
```

## 4. ResponsiveTable Component

### Component Location
`frontend/src/components/common/ResponsiveTable.tsx`

### Features
- ✅ Automatic mobile/desktop switching (breakpoint: 1024px)
- ✅ Column priority system (high, medium, low)
- ✅ Custom mobile card renderer support
- ✅ Default mobile card layout
- ✅ No horizontal scrolling
- ✅ All data preserved in mobile view
- ✅ Desktop table preserved

### Usage

```typescript
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common';

const columns: ResponsiveTableColumn<DataType>[] = [
  {
    id: 'id',
    label: 'ID',
    priority: 'high',
    render: (row) => <Typography>{row.id}</Typography>,
    mobileLabel: 'Identifier', // Optional: custom label for mobile
  },
  {
    id: 'status',
    label: 'Status',
    priority: 'high',
    render: (row) => <StatusBadge status={row.status} />,
  },
  // ... more columns
];

<ResponsiveTable
  columns={columns}
  data={data}
  keyExtractor={(row) => row.id}
  emptyMessage="No data available"
  onRowClick={(row) => navigate(`/details/${row.id}`)}
  mobileCardRenderer={(row) => <CustomCard row={row} />} // Optional
  tableProps={{ stickyHeader: true }}
  cardProps={{ variant: 'outlined' }}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `ResponsiveTableColumn[]` | Yes | Column definitions with priorities |
| `data` | `T[]` | Yes | Data array |
| `keyExtractor` | `(row: T) => string \| number` | Yes | Unique key for each row |
| `emptyMessage` | `string` | No | Message when no data |
| `onRowClick` | `(row: T) => void` | No | Click handler |
| `mobileBreakpoint` | `number` | No | Breakpoint in px (default: 1024) |
| `mobileCardRenderer` | `(row: T) => ReactNode` | No | Custom mobile card |
| `tableProps` | `object` | No | Table styling props |
| `cardProps` | `object` | No | Card styling props |

### Column Definition

```typescript
interface ResponsiveTableColumn<T> {
  id: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  mobileLabel?: string; // Custom label for mobile
  mobileRender?: (row: T, index: number) => ReactNode; // Custom renderer for mobile
}
```

## 5. Files/Components to Update

### ✅ Already Using ResponsiveTable
- `frontend/src/pages/Bids/BidList.tsx`
- `frontend/src/pages/Bids/BidComparison.tsx`
- `frontend/src/pages/Contracts/ContractList.tsx`
- `frontend/src/pages/Payments/PaymentList.tsx`
- `frontend/src/pages/RFQs/RFQList.tsx`

### 🔄 Need Conversion
- `frontend/src/pages/Shipments/ShipmentList.tsx` → Convert to ResponsiveTable
- `frontend/src/pages/Disputes/DisputeList.tsx` → Convert to ResponsiveTable

### ⚠️ Check for Usage
- `frontend/src/components/DataTable/EnterpriseDataTable.tsx` → Add mobile support if used
- `frontend/src/components/DesignSystem/EnterpriseTable/EnterpriseTable.tsx` → Add mobile support if used

## 6. Acceptance Criteria for Mobile Usability

### Functional Requirements

1. **No Horizontal Scrolling**
   - ✅ Tables never require horizontal scroll on mobile (< 1024px)
   - ✅ All content fits within viewport width
   - ✅ Test on devices: 320px, 375px, 414px, 768px

2. **All Data Visible**
   - ✅ Every column from desktop table is accessible on mobile
   - ✅ No data is hidden or truncated beyond reasonable limits
   - ✅ Truncated text has ellipsis and tooltip/expand option

3. **Touch-Friendly**
   - ✅ Card tap targets ≥ 44px height
   - ✅ Action buttons easily tappable
   - ✅ No accidental clicks on adjacent items

4. **Performance**
   - ✅ Smooth scrolling on mobile devices
   - ✅ No layout shift during render
   - ✅ Fast initial render (< 1s on 3G)

### Visual Requirements

1. **Readability**
   - ✅ Text size ≥ 14px on mobile
   - ✅ Sufficient contrast (WCAG AA)
   - ✅ Clear visual hierarchy

2. **Layout**
   - ✅ High priority fields prominent
   - ✅ Clear separation between items
   - ✅ Consistent spacing (8px grid)

3. **Status Indicators**
   - ✅ Status badges clearly visible
   - ✅ Color coding accessible (not color-only)
   - ✅ Icons support text labels

### User Experience

1. **Navigation**
   - ✅ Easy to tap and navigate to details
   - ✅ Clear visual feedback on interaction
   - ✅ Loading states visible

2. **Empty States**
   - ✅ Clear message when no data
   - ✅ Helpful guidance (filters, actions)

3. **Error Handling**
   - ✅ Error messages readable on mobile
   - ✅ Retry actions accessible

### Testing Checklist

- [ ] Test on iPhone SE (320px width)
- [ ] Test on iPhone 12/13 (390px width)
- [ ] Test on iPhone 14 Pro Max (430px width)
- [ ] Test on iPad (768px width)
- [ ] Test on Android phones (360px, 412px)
- [ ] Test landscape orientation
- [ ] Test with slow 3G connection
- [ ] Test with screen reader (accessibility)
- [ ] Test with keyboard navigation
- [ ] Verify no console errors

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1
- **Largest Contentful Paint**: < 2.5s

## 7. Implementation Checklist

### For Each Table

1. **Analyze Data Structure**
   - [ ] Identify all columns
   - [ ] Determine priority (high/medium/low)
   - [ ] Identify primary actions

2. **Define Columns**
   - [ ] Create column definitions with priorities
   - [ ] Add mobile labels if needed
   - [ ] Create render functions

3. **Test Mobile Layout**
   - [ ] Verify no horizontal scroll
   - [ ] Check all data visible
   - [ ] Test touch interactions
   - [ ] Verify accessibility

4. **Optimize Performance**
   - [ ] Check render performance
   - [ ] Optimize large lists (virtualization if needed)
   - [ ] Test on slow connections

## 8. Best Practices

### Column Priority
- **Be selective**: Only 2-3 high priority columns
- **User-focused**: Prioritize what users need most
- **Context-aware**: Different priorities for different roles

### Mobile Labels
- **Shorter labels**: "Del. Date" instead of "Delivery Date"
- **Clear abbreviations**: Use common abbreviations
- **Contextual**: Mobile label can differ from desktop

### Custom Renderers
- **Reuse components**: Use existing badge/card components
- **Consistent styling**: Match app design system
- **Accessible**: Include ARIA labels, keyboard support

### Performance
- **Virtualization**: For lists > 100 items
- **Lazy loading**: Load data incrementally
- **Memoization**: Memoize column definitions

## 9. Migration Guide

### Converting Existing Tables

1. **Identify table component**
   ```typescript
   // Before: EnterpriseDataTable or custom table
   <EnterpriseDataTable columns={columns} rows={data} />
   ```

2. **Convert to ResponsiveTable**
   ```typescript
   // After: ResponsiveTable with priorities
   <ResponsiveTable
     columns={columnsWithPriorities}
     data={data}
     keyExtractor={(row) => row.id}
   />
   ```

3. **Add priorities to columns**
   ```typescript
   const columns = [
     { id: 'id', label: 'ID', priority: 'high', ... },
     { id: 'status', label: 'Status', priority: 'high', ... },
     // ...
   ];
   ```

4. **Test on mobile**
   - Open DevTools → Device toolbar
   - Test at 320px, 375px, 414px
   - Verify no horizontal scroll
   - Check all data visible

## 10. Examples

See implementation in:
- `frontend/src/pages/Bids/BidList.tsx` - Complete example
- `frontend/src/pages/Contracts/ContractList.tsx` - With custom card renderer
- `frontend/src/pages/Payments/PaymentList.tsx` - With status badges
