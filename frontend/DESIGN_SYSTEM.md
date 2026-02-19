# TriLink Design System
## UAE's Sovereign Digital Trade, Procurement & Supply Chain Platform

### Design Philosophy

**Institutional | Authoritative | Sovereign**

TriLink's design system is built for national-scale B2B platforms, procurement systems, and sovereign digital infrastructure. Every design decision prioritizes:

- **Trust** - Visual language that conveys security and reliability
- **Transparency** - Clear information hierarchy and data presentation
- **Power** - Institutional authority without arrogance
- **Intelligence** - Strategic, data-driven decision support

### Core Principles

1. **High Data Density, Ultra-Clear** - Maximum information with zero confusion
2. **Enterprise-Grade** - Comparable to SAP, Palantir, Oracle, Bloomberg
3. **Zero Visual Noise** - Every element serves a purpose
4. **Grid-Based Modularity** - Scalable, consistent layouts
5. **Minimal Icons, Strong Hierarchy** - Typography and spacing drive clarity

---

## Color System

### Base Colors - Black Pearl & Chinese Black

The foundation of the design system uses deep, authoritative dark backgrounds:

```typescript
// Black Pearl - Primary dark base
blackPearl: '#0A0E27'
blackPearlLight: '#0D1117'
blackPearlLighter: '#161B22'

// Chinese Black - Secondary dark base
chineseBlack: '#0F0F0F'
chineseBlackLight: '#1A1A1A'
```

**Usage:**
- Main application background: `blackPearl`
- Card/surface backgrounds: `blackPearlLight`
- Elevated surfaces: `blackPearlLighter`

### Intelligence Blue Accents - Cerulean & Azure

Strategic, intelligent, trustworthy blue accents:

```typescript
// Cerulean - Primary intelligence color
cerulean: '#007BA7'
ceruleanLight: '#0096CC'
ceruleanDark: '#005A7A'

// Azure - Secondary intelligence color
azure: '#0080FF'
azureLight: '#3399FF'
azureDark: '#0066CC'
```

**Usage:**
- Primary actions: `cerulean`
- Interactive elements: `ceruleanLight`
- Hover states: `ceruleanDark`
- Secondary actions: `azure`

### Data Surface Colors - Clean White

High contrast, maximum readability for data tables:

```typescript
white: '#FFFFFF'
dataBg: '#FFFFFF'
dataBgAlt: '#F8F9FA'
dataText: '#0A0E27'
dataTextSecondary: '#2D2D2D'
```

**Usage:**
- Data table backgrounds: `white`
- Alternating rows: `dataBgAlt`
- Primary data text: `dataText`
- Secondary data text: `dataTextSecondary`

### Semantic Colors

Clear, unambiguous status indicators:

```typescript
success: '#10B981'  // Green
warning: '#F59E0B'  // Amber
error: '#EF4444'    // Red
info: '#007BA7'     // Cerulean
critical: '#DC2626' // Dark Red
```

---

## Typography

### Font Family

**Primary:** Montserrat
- Professional, modern, authoritative
- Excellent readability at all sizes
- Strong hierarchy support

**Fallback Stack:**
```css
'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif
```

### Type Scale

| Element | Size | Weight | Use Case |
|---------|------|--------|----------|
| H1 | 2.5rem (40px) | 700 | Page titles |
| H2 | 2rem (32px) | 700 | Section titles |
| H3 | 1.75rem (28px) | 600 | Subsection titles |
| H4 | 1.5rem (24px) | 600 | Card titles |
| H5 | 1.25rem (20px) | 600 | Small headings |
| H6 | 1.125rem (18px) | 600 | Smallest headings |
| Body | 0.9375rem (15px) | 400 | Standard text |
| Body Small | 0.875rem (14px) | 400 | Secondary text |
| Data | 0.875rem (14px) | 400 | Table data |
| Caption | 0.8125rem (13px) | 400 | Tertiary text |

### Typography Principles

1. **Strong Hierarchy** - Clear visual distinction between levels
2. **Consistent Spacing** - Line height 1.5 for body, 1.2 for headings
3. **Readability First** - Minimum 14px for body text
4. **Data Clarity** - 14px standard for table data, supports high density

---

## Spacing System

### Base Unit: 4px

All spacing uses multiples of 4px for consistency:

```typescript
xs: '4px'    // 1 unit
sm: '8px'    // 2 units
md: '12px'   // 3 units
lg: '16px'   // 4 units
xl: '24px'   // 6 units
xxl: '32px'  // 8 units
xxxl: '48px' // 12 units
huge: '64px' // 16 units
```

### Semantic Spacing

- **Component Padding:** 16px
- **Section Padding:** 24px
- **Page Padding:** 32px
- **Card Padding:** 20px
- **Table Cell Padding:** 12px 16px

---

## Grid System

### 12-Column Grid

TriLink uses a responsive 12-column grid system:

```tsx
import { GridContainer, GridRow, GridColumn } from '@/components/Layout';

<GridContainer maxWidth="default">
  <GridRow gutter="default">
    <GridColumn xs={12} md={6} lg={4}>
      {/* Content */}
    </GridColumn>
    <GridColumn xs={12} md={6} lg={8}>
      {/* Content */}
    </GridColumn>
  </GridRow>
</GridContainer>
```

### Breakpoints

| Size | Width | Use Case |
|------|-------|----------|
| xs | 0px+ | Mobile |
| sm | 600px+ | Tablet |
| md | 900px+ | Desktop |
| lg | 1200px+ | Large Desktop |
| xl | 1536px+ | Extra Large |

### Container Widths

- **Default:** 1440px
- **Wide:** 1600px
- **Narrow:** 1200px
- **Fluid:** 100%

---

## Components

### Enterprise Data Table

High-density data tables with clean white surfaces:

```tsx
import { EnterpriseDataTable } from '@/components/DataTable';

<EnterpriseDataTable
  columns={columns}
  rows={rows}
  selectable
  sortable
  pagination
  dense={false}
/>
```

**Features:**
- Clean white background for maximum readability
- Alternating row colors for scanability
- Sortable columns
- Selectable rows
- Pagination
- Dense mode for high data density

### Enterprise Card

Institutional card design:

```tsx
import { EnterpriseCard } from '@/components/common';

<EnterpriseCard
  title="Card Title"
  subtitle="Card Subtitle"
  variant="default"
  dense={false}
>
  {/* Content */}
</EnterpriseCard>
```

**Variants:**
- `default` - Standard card with border
- `elevated` - Card with shadow
- `outlined` - Transparent with strong border

### Status Badge

Clear status indicators:

```tsx
import { StatusBadge } from '@/components/common';

<StatusBadge
  status="success"
  label="Active"
  variant="filled"
/>
```

**Status Types:**
- `success` - Green
- `warning` - Amber
- `error` - Red
- `info` - Blue
- `neutral` - Gray
- `critical` - Dark Red

---

## Borders & Shadows

### Border Radius

```typescript
xs: '2px'   // Subtle rounding
sm: '4px'   // Small elements
md: '6px'   // Standard
lg: '8px'   // Cards
xl: '12px'  // Large elements
full: '9999px' // Pills/badges
```

### Shadows

Minimal shadows for depth:

```typescript
xs: '0 1px 2px rgba(0, 0, 0, 0.3)'
sm: '0 2px 4px rgba(0, 0, 0, 0.3)'
md: '0 4px 8px rgba(0, 0, 0, 0.4)'
lg: '0 8px 16px rgba(0, 0, 0, 0.5)'
intelligence: '0 4px 12px rgba(0, 123, 167, 0.3)'
```

---

## Usage Guidelines

### Do's ✅

- Use Black Pearl base for all dark surfaces
- Use Cerulean/Azure for all interactive elements
- Use clean white for data tables
- Maintain consistent 4px spacing grid
- Use Montserrat for all text
- Keep visual noise to absolute minimum
- Prioritize data clarity over decoration

### Don'ts ❌

- Don't use gradients except for intelligence accents
- Don't use decorative icons unnecessarily
- Don't break the 4px spacing grid
- Don't use colors outside the defined palette
- Don't add visual effects that don't serve function
- Don't compromise data readability for aesthetics

---

## Implementation

### Import Design Tokens

```typescript
import { designTokens } from '@/theme/designTokens';

const { colors, typography, spacing } = designTokens;
```

### Use Theme

```typescript
import { useTheme } from '@mui/material';
import { theme } from '@/theme/theme';

const theme = useTheme();
```

### Component Examples

See component files in:
- `frontend/src/components/DataTable/`
- `frontend/src/components/Layout/`
- `frontend/src/components/common/`

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- **Color Contrast:** Minimum 4.5:1 for text
- **Focus Indicators:** Clear 2px outlines
- **Keyboard Navigation:** Full keyboard support
- **Screen Readers:** Proper ARIA labels
- **Touch Targets:** Minimum 44x44px

---

## Design System Files

- **Design Tokens:** `frontend/src/theme/designTokens.ts`
- **Theme Configuration:** `frontend/src/theme/theme.ts`
- **Grid System:** `frontend/src/components/Layout/GridSystem.tsx`
- **Data Table:** `frontend/src/components/DataTable/EnterpriseDataTable.tsx`
- **Components:** `frontend/src/components/common/`

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Maintained by:** TriLink Design Team