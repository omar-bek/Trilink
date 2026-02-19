# TriLink Design System - Quick Start Guide

## Overview

TriLink's government-grade design system is now fully implemented. This guide shows you how to use it.

## Key Files

- **Design Tokens:** `src/theme/designTokens.ts` - All design constants
- **Theme:** `src/theme/theme.ts` - MUI theme configuration
- **Grid System:** `src/components/Layout/GridSystem.tsx` - 12-column grid
- **Data Table:** `src/components/DataTable/EnterpriseDataTable.tsx` - Enterprise tables
- **Components:** `src/components/common/` - Reusable components

## Quick Examples

### Using the Grid System

```tsx
import { GridContainer, GridRow, GridColumn } from '@/components/Layout';

function MyPage() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn xs={12} md={6} lg={4}>
          <EnterpriseCard title="Card 1">Content</EnterpriseCard>
        </GridColumn>
        <GridColumn xs={12} md={6} lg={8}>
          <EnterpriseCard title="Card 2">Content</EnterpriseCard>
        </GridColumn>
      </GridRow>
    </GridContainer>
  );
}
```

### Using Enterprise Data Table

```tsx
import { EnterpriseDataTable } from '@/components/DataTable';

const columns = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'amount', label: 'Amount', align: 'right', format: (val) => `$${val}` },
];

const rows = [
  { id: 1, name: 'Item 1', status: 'Active', amount: 1000 },
  { id: 2, name: 'Item 2', status: 'Pending', amount: 2000 },
];

function MyTable() {
  return (
    <EnterpriseDataTable
      columns={columns}
      rows={rows}
      selectable
      sortable
      pagination
    />
  );
}
```

### Using Enterprise Card

```tsx
import { EnterpriseCard } from '@/components/common';

function MyCard() {
  return (
    <EnterpriseCard
      title="Card Title"
      subtitle="Card Subtitle"
      variant="default"
    >
      Card content goes here
    </EnterpriseCard>
  );
}
```

### Using Status Badge

```tsx
import { StatusBadge } from '@/components/common';

function MyStatus() {
  return (
    <StatusBadge
      status="success"
      label="Active"
      variant="filled"
    />
  );
}
```

### Using Design Tokens Directly

```tsx
import { designTokens } from '@/theme/designTokens';

const { colors, typography, spacing } = designTokens;

function MyComponent() {
  return (
    <Box
      sx={{
        backgroundColor: colors.base.blackPearl,
        color: colors.intelligence.ceruleanLight,
        padding: spacing.lg,
        fontSize: typography.fontSize.body,
      }}
    >
      Content
    </Box>
  );
}
```

## Color Usage

### Dark Surfaces (Default)
- Main background: `colors.base.blackPearl`
- Card background: `colors.base.blackPearlLight`
- Elevated surfaces: `colors.base.blackPearlLighter`

### Intelligence Accents
- Primary actions: `colors.intelligence.cerulean`
- Interactive elements: `colors.intelligence.ceruleanLight`
- Secondary actions: `colors.intelligence.azure`

### Data Tables (White Surfaces)
- Table background: `colors.data.white`
- Text: `colors.data.dataText`
- Secondary text: `colors.data.dataTextSecondary`

## Typography

```tsx
<Typography variant="h1">Page Title</Typography>
<Typography variant="h2">Section Title</Typography>
<Typography variant="h3">Subsection Title</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="body2">Secondary text</Typography>
```

## Spacing

Use the spacing tokens for consistent spacing:

```tsx
<Box sx={{ padding: spacing.lg }}>  // 16px
<Box sx={{ margin: spacing.xl }}>   // 24px
<Box sx={{ gap: spacing.md }}>      // 12px
```

## Next Steps

1. Review `DESIGN_SYSTEM.md` for complete documentation
2. Check component examples in `src/components/`
3. Use design tokens for all styling
4. Follow the grid system for layouts
5. Use Enterprise Data Table for all data displays

## Migration Notes

The theme has been updated to use the new design tokens. Existing components should continue to work, but you can now:

- Use the new grid system for layouts
- Use EnterpriseDataTable for better data presentation
- Use EnterpriseCard for consistent card styling
- Use StatusBadge for status indicators
- Access design tokens directly for custom styling

All components maintain backward compatibility with existing code.