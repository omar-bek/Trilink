/**
 * TriLink Design Tokens
 * 
 * Government-Grade Sovereign Digital Trade Platform Design System
 * 
 * Design Philosophy:
 * - Institutional, authoritative, sovereign
 * - High data density but ultra-clear
 * - Enterprise-grade (SAP, Palantir, Oracle, Bloomberg)
 * - Zero visual noise
 * - Trust, transparency, power, intelligence
 * 
 * Visual Style:
 * - Dark professional base (Black Pearl / Chinese Black)
 * - Blue intelligence accents (Cerulean / Azure)
 * - Clean white surfaces for data tables
 * - Montserrat typography
 * - Grid-based, modular, scalable UI
 * - Minimal icons, strong hierarchy
 */

// ============================================================================
// COLOR SYSTEM - Sovereign Professional Palette
// ============================================================================

/**
 * Base Colors - Black Pearl & Chinese Black
 * Deep, authoritative backgrounds that convey institutional power
 */
export const baseColors = {
  // Black Pearl - Primary dark base (#0A0E27 / #0D1117)
  blackPearl: '#0A0E27',
  blackPearlLight: '#0D1117',
  blackPearlLighter: '#161B22',
  
  // Chinese Black - Secondary dark base (#0F0F0F / #1A1A1A)
  chineseBlack: '#0F0F0F',
  chineseBlackLight: '#1A1A1A',
  chineseBlackLighter: '#252525',
  
  // Pure Black - Deepest level
  pureBlack: '#000000',
  
  // Neutral Grays - For subtle differentiation
  neutral900: '#0F0F0F',
  neutral800: '#1A1A1A',
  neutral700: '#252525',
  neutral600: '#2D2D2D',
  neutral500: '#3A3A3A',
  neutral400: '#4A4A4A',
  neutral300: '#6B6B6B',
  neutral200: '#9A9A9A',
  neutral100: '#CACACA',
  neutral50: '#F5F5F5',
} as const;

/**
 * Intelligence Blue Accents - Cerulean & Azure
 * Strategic, intelligent, trustworthy
 */
export const intelligenceBlues = {
  // Cerulean - Primary intelligence color (#007BA7)
  cerulean: '#007BA7',
  ceruleanLight: '#0096CC',
  ceruleanLighter: '#00B0E6',
  ceruleanDark: '#005A7A',
  ceruleanDarker: '#003D52',
  
  // Azure - Secondary intelligence color (#0080FF)
  azure: '#0080FF',
  azureLight: '#3399FF',
  azureLighter: '#66B2FF',
  azureDark: '#0066CC',
  azureDarker: '#004C99',
  
  // Blue Steel - Tertiary accent (#4682B4)
  blueSteel: '#4682B4',
  blueSteelLight: '#6BA3D1',
  blueSteelDark: '#2E5A7A',
  
  // Intelligence Gradients
  intelligenceGradient: 'linear-gradient(135deg, #007BA7 0%, #0080FF 100%)',
  intelligenceGradientDark: 'linear-gradient(135deg, #005A7A 0%, #0066CC 100%)',
  intelligenceGradientLight: 'linear-gradient(135deg, #00B0E6 0%, #66B2FF 100%)',
} as const;

/**
 * Data Surface Colors - Clean White for Tables
 * High contrast, maximum readability for data
 */
export const dataSurfaces = {
  // Pure white for data tables
  white: '#FFFFFF',
  whiteSoft: '#FAFAFA',
  whiteWarm: '#FCFCFC',
  
  // Subtle backgrounds for data containers
  dataBg: '#FFFFFF',
  dataBgAlt: '#F8F9FA',
  dataBgHover: '#F0F2F5',
  
  // Data text on white
  dataText: '#0A0E27',
  dataTextSecondary: '#2D2D2D',
  dataTextTertiary: '#6B6B6B',
  
  // Borders for data tables
  dataBorder: '#E5E7EB',
  dataBorderStrong: '#D1D5DB',
  dataBorderSubtle: '#F3F4F6',
} as const;

/**
 * Semantic Colors - Status & Feedback
 * Clear, unambiguous status indicators
 */
export const semanticColors = {
  // Success - Green
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  successBg: '#D1FAE5',
  successText: '#065F46',
  
  // Warning - Amber
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  warningBg: '#FEF3C7',
  warningText: '#92400E',
  
  // Error - Red
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  errorBg: '#FEE2E2',
  errorText: '#991B1B',
  
  // Info - Intelligence Blue
  info: intelligenceBlues.cerulean,
  infoLight: intelligenceBlues.ceruleanLight,
  infoDark: intelligenceBlues.ceruleanDark,
  infoBg: '#E0F2FE',
  infoText: '#0C4A6E',
  
  // Critical - High priority
  critical: '#DC2626',
  criticalLight: '#F87171',
  criticalDark: '#B91C1C',
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM - Montserrat Professional
// ============================================================================

export const typography = {
  fontFamily: {
    primary: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
  },
  
  fontSize: {
    // Headings - Strong hierarchy
    h1: '2.5rem',      // 40px - Page titles
    h2: '2rem',        // 32px - Section titles
    h3: '1.75rem',     // 28px - Subsection titles
    h4: '1.5rem',      // 24px - Card titles
    h5: '1.25rem',     // 20px - Small headings
    h6: '1.125rem',    // 18px - Smallest headings
    
    // Body - Readable, professional
    bodyLarge: '1rem',      // 16px - Primary body
    body: '0.9375rem',      // 15px - Standard body
    bodySmall: '0.875rem',  // 14px - Secondary text
    bodyTiny: '0.8125rem',  // 13px - Tertiary text
    
    // Data - Dense but clear
    dataLarge: '0.9375rem',  // 15px - Important data
    data: '0.875rem',        // 14px - Standard data
    dataSmall: '0.8125rem', // 13px - Secondary data
    dataTiny: '0.75rem',     // 12px - Tertiary data
    
    // UI Elements
    button: '0.9375rem',     // 15px
    label: '0.875rem',       // 14px
    caption: '0.8125rem',    // 13px
  },
  
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
  },
} as const;

// ============================================================================
// SPACING SYSTEM - 4px Base Grid
// ============================================================================

export const spacing = {
  // Base unit: 4px
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
  huge: '64px',
  
  // Semantic spacing
  componentPadding: '16px',
  sectionPadding: '24px',
  pagePadding: '32px',
  cardPadding: '20px',
  tableCellPadding: '12px 16px',
} as const;

// ============================================================================
// LAYOUT SYSTEM - Grid-Based Modular
// ============================================================================

export const layout = {
  // Grid columns (12-column system)
  gridColumns: 12,
  gridGutter: '24px',
  gridGutterSmall: '16px',
  
  // Container widths
  containerMaxWidth: '1440px',
  containerWide: '1600px',
  containerNarrow: '1200px',
  
  // Sidebar & Navigation
  sidebarWidth: '280px',
  sidebarCollapsedWidth: '64px',
  topbarHeight: '64px',
  
  // Breakpoints (MUI compatible)
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    notification: 1700,
  },
} as const;

// ============================================================================
// BORDER & SHADOW SYSTEM
// ============================================================================

export const borders = {
  radius: {
    none: '0',
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  
  width: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '3px',
  },
  
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
  },
  
  // Border colors
  color: {
    default: 'rgba(0, 123, 167, 0.2)',
    strong: 'rgba(0, 123, 167, 0.4)',
    subtle: 'rgba(255, 255, 255, 0.05)',
    data: dataSurfaces.dataBorder,
    dataStrong: dataSurfaces.dataBorderStrong,
  },
} as const;

export const shadows = {
  // Minimal shadows - enterprise feel
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 4px 8px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.6)',
  
  // Colored shadows for intelligence accents
  intelligence: '0 4px 12px rgba(0, 123, 167, 0.3)',
  intelligenceStrong: '0 8px 24px rgba(0, 123, 167, 0.4)',
  
  // Data surface shadows (subtle)
  data: '0 1px 3px rgba(0, 0, 0, 0.1)',
  dataHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
} as const;

// ============================================================================
// TRANSITION SYSTEM
// ============================================================================

export const transitions = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  
  // Standard transitions
  standard: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '150ms cubic-bezier(0, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================================================
// DATA TABLE SYSTEM
// ============================================================================

export const dataTable = {
  // Row heights
  rowHeight: '48px',
  rowHeightCompact: '40px',
  rowHeightComfortable: '56px',
  
  // Header
  headerHeight: '56px',
  headerBg: dataSurfaces.white,
  headerText: dataSurfaces.dataText,
  headerBorder: dataSurfaces.dataBorderStrong,
  
  // Cell
  cellPadding: spacing.tableCellPadding,
  cellFontSize: typography.fontSize.data,
  
  // Row states
  rowBg: dataSurfaces.white,
  rowBgAlt: dataSurfaces.dataBgAlt,
  rowBgHover: dataSurfaces.dataBgHover,
  rowBgSelected: '#E0F2FE',
  
  // Borders
  borderColor: dataSurfaces.dataBorder,
  borderColorStrong: dataSurfaces.dataBorderStrong,
} as const;

// ============================================================================
// COMPONENT SPECIFIC TOKENS
// ============================================================================

export const components = {
  button: {
    height: {
      small: '32px',
      medium: '40px',
      large: '48px',
    },
    padding: {
      small: '8px 16px',
      medium: '12px 24px',
      large: '16px 32px',
    },
    borderRadius: borders.radius.md,
  },
  
  input: {
    height: {
      small: '36px',
      medium: '40px',
      large: '48px',
    },
    padding: {
      horizontal: '12px',
      vertical: '10px',
    },
    borderRadius: borders.radius.md,
  },
  
  card: {
    padding: spacing.cardPadding,
    borderRadius: borders.radius.lg,
    borderWidth: borders.width.thin,
    borderColor: borders.color.default,
  },
  
  chip: {
    height: '28px',
    padding: '4px 12px',
    borderRadius: borders.radius.full,
    fontSize: typography.fontSize.bodyTiny,
  },
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
  colors: {
    base: baseColors,
    intelligence: intelligenceBlues,
    data: dataSurfaces,
    semantic: semanticColors,
  },
  typography,
  spacing,
  layout,
  borders,
  shadows,
  transitions,
  dataTable,
  components,
} as const;

export default designTokens;