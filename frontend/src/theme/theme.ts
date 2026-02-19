/**
 * TriLink Enterprise Theme
 * 
 * Government-Grade Sovereign Digital Trade Platform
 * 
 * Built on design tokens for institutional, authoritative, sovereign design
 * Enterprise-grade (SAP, Palantir, Oracle, Bloomberg style)
 */

import { createTheme } from '@mui/material/styles';
import { designTokens } from './designTokens';

const {
  colors: { base, intelligence, semantic },
  typography,
  spacing,
  layout,
  borders,
  shadows,
  transitions,
  dataTable,
  components,
} = designTokens;

// ============================================================================
// MUI THEME CONFIGURATION
// ============================================================================

export const theme = createTheme({
  palette: {
    mode: 'dark',

    // Primary - Intelligence Blue (Cerulean)
    primary: {
      main: intelligence.cerulean,
      light: intelligence.ceruleanLight,
      dark: intelligence.ceruleanDark,
      contrastText: '#FFFFFF',
    },

    // Secondary - Azure
    secondary: {
      main: intelligence.azure,
      light: intelligence.azureLight,
      dark: intelligence.azureDark,
      contrastText: '#FFFFFF',
    },

    // Semantic Colors
    success: {
      main: semantic.success,
      light: semantic.successLight,
      dark: semantic.successDark,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: semantic.warning,
      light: semantic.warningLight,
      dark: semantic.warningDark,
      contrastText: '#FFFFFF',
    },
    error: {
      main: semantic.error,
      light: semantic.errorLight,
      dark: semantic.errorDark,
      contrastText: '#FFFFFF',
    },
    info: {
      main: semantic.info,
      light: semantic.infoLight,
      dark: semantic.infoDark,
      contrastText: '#FFFFFF',
    },

    // Background - Black Pearl base
    background: {
      default: base.blackPearl,
      paper: base.blackPearlLight,
    },

    // Text Colors
    text: {
      primary: '#FFFFFF',
      secondary: base.neutral200,
      disabled: base.neutral400,
    },

    // Grey Scale
    grey: {
      50: base.neutral50,
      100: base.neutral100,
      200: base.neutral200,
      300: base.neutral300,
      400: base.neutral400,
      500: base.neutral500,
      600: base.neutral600,
      700: base.neutral700,
      800: base.neutral800,
      900: base.neutral900,
    },

    // Divider
    divider: borders.color.subtle,
  },

  // ============================================================================
  // TYPOGRAPHY - Montserrat Professional
  // ============================================================================
  typography: {
    fontFamily: typography.fontFamily.primary,

    // Headings - Strong hierarchy, institutional authority
    h1: {
      fontSize: typography.fontSize.h1,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
      color: '#FFFFFF',
    },
    h2: {
      fontSize: typography.fontSize.h2,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
      color: '#FFFFFF',
    },
    h3: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      color: '#FFFFFF',
    },
    h4: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      color: '#FFFFFF',
    },
    h5: {
      fontSize: typography.fontSize.h5,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      color: '#FFFFFF',
    },
    h6: {
      fontSize: typography.fontSize.h6,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      color: '#FFFFFF',
    },

    // Body Text
    body1: {
      fontSize: typography.fontSize.body,
      lineHeight: typography.lineHeight.normal,
      color: base.neutral200,
    },
    body2: {
      fontSize: typography.fontSize.bodySmall,
      lineHeight: typography.lineHeight.normal,
      color: base.neutral300,
    },

    // Button
    button: {
      textTransform: 'none',
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: typography.letterSpacing.wide,
      fontSize: typography.fontSize.button,
    },

    // Caption
    caption: {
      fontSize: typography.fontSize.caption,
      lineHeight: typography.lineHeight.normal,
      color: base.neutral400,
    },

    // Overline
    overline: {
      fontSize: typography.fontSize.bodyTiny,
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: typography.letterSpacing.wider,
      textTransform: 'uppercase',
      color: base.neutral300,
    },
  },

  // ============================================================================
  // SHAPE & SPACING
  // ============================================================================
  shape: {
    borderRadius: parseInt(borders.radius.md),
  },

  spacing: 4, // Base unit: 4px (MUI multiplies by this value)

  // ============================================================================
  // BREAKPOINTS
  // ============================================================================
  breakpoints: {
    values: layout.breakpoints,
  },

  // ============================================================================
  // COMPONENT OVERRIDES - Enterprise-Grade Styling
  // ============================================================================
  components: {
    // ========================================================================
    // BUTTON - Professional, authoritative
    // ========================================================================
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borders.radius.md,
          padding: components.button.padding.medium,
          fontWeight: typography.fontWeight.semibold,
          textTransform: 'none',
          transition: transitions.standard,
          minHeight: components.button.height.medium,
          '&:focus-visible': {
            outline: `${borders.width.medium} solid`,
            outlineColor: intelligence.cerulean,
            outlineOffset: spacing.sm,
          },
        },
        contained: {
          boxShadow: shadows.sm,
          '&:hover': {
            boxShadow: shadows.md,
          },
          '&.MuiButton-containedPrimary': {
            background: intelligence.intelligenceGradient,
            '&:hover': {
              background: intelligence.intelligenceGradientDark,
              boxShadow: shadows.intelligence,
            },
          },
          '&.MuiButton-containedSecondary': {
            backgroundColor: intelligence.azure,
            '&:hover': {
              backgroundColor: intelligence.azureDark,
            },
          },
        },
        outlined: {
          borderWidth: borders.width.medium,
          borderColor: intelligence.cerulean,
          color: intelligence.ceruleanLight,
          '&:hover': {
            borderWidth: borders.width.medium,
            borderColor: intelligence.ceruleanLight,
            backgroundColor: 'rgba(0, 123, 167, 0.1)',
          },
        },
        text: {
          color: intelligence.ceruleanLight,
          '&:hover': {
            backgroundColor: 'rgba(0, 123, 167, 0.1)',
          },
        },
        sizeSmall: {
          minHeight: components.button.height.small,
          padding: components.button.padding.small,
          fontSize: typography.fontSize.bodySmall,
        },
        sizeLarge: {
          minHeight: components.button.height.large,
          padding: components.button.padding.large,
          fontSize: typography.fontSize.body,
        },
      },
    },

    // ========================================================================
    // ICON BUTTON
    // ========================================================================
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: transitions.standard,
          '&:focus-visible': {
            outline: `${borders.width.medium} solid`,
            outlineColor: intelligence.cerulean,
            outlineOffset: spacing.xs,
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 123, 167, 0.1)',
          },
        },
      },
    },

    // ========================================================================
    // CARD - Institutional, authoritative
    // ========================================================================
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: base.blackPearlLight,
          boxShadow: shadows.sm,
          borderRadius: borders.radius.lg,
          border: `${borders.width.thin} solid ${borders.color.default}`,
          transition: transitions.standard,
          padding: components.card.padding,
          '&:hover': {
            borderColor: borders.color.strong,
            boxShadow: shadows.md,
          },
        },
      },
    },

    // ========================================================================
    // TEXT FIELD - Professional input
    // ========================================================================
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borders.radius.md,
            backgroundColor: base.blackPearlLighter,
            transition: transitions.standard,
            '& fieldset': {
              borderColor: borders.color.default,
              borderWidth: borders.width.thin,
            },
            '&:hover fieldset': {
              borderColor: intelligence.ceruleanLight,
            },
            '&.Mui-focused fieldset': {
              borderWidth: borders.width.medium,
              borderColor: intelligence.cerulean,
            },
            '& input': {
              color: '#FFFFFF',
              fontSize: typography.fontSize.body,
            },
            '& textarea': {
              color: '#FFFFFF',
              fontSize: typography.fontSize.body,
            },
          },
          '& .MuiInputLabel-root': {
            color: base.neutral300,
            '&.Mui-focused': {
              color: intelligence.ceruleanLight,
            },
          },
        },
      },
    },

    // ========================================================================
    // SELECT
    // ========================================================================
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: base.blackPearlLighter,
          color: '#FFFFFF',
          transition: transitions.standard,
          '&:focus-visible': {
            outline: `${borders.width.medium} solid`,
            outlineColor: intelligence.cerulean,
            outlineOffset: spacing.xs,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borders.color.default,
            borderWidth: borders.width.thin,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: intelligence.ceruleanLight,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: intelligence.cerulean,
            borderWidth: borders.width.medium,
          },
        },
      },
    },

    // ========================================================================
    // PAPER
    // ========================================================================
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: base.blackPearlLight,
          color: '#FFFFFF',
          backgroundImage: 'none',
        },
      },
    },

    // ========================================================================
    // MENU ITEM
    // ========================================================================
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: base.blackPearlLight,
          color: base.neutral200,
          transition: transitions.fast,
          '&:hover': {
            backgroundColor: base.blackPearlLighter,
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 123, 167, 0.2)',
            color: intelligence.ceruleanLight,
            '&:hover': {
              backgroundColor: 'rgba(0, 123, 167, 0.3)',
            },
          },
        },
      },
    },

    // ========================================================================
    // LINK
    // ========================================================================
    MuiLink: {
      styleOverrides: {
        root: {
          color: intelligence.ceruleanLight,
          textDecoration: 'none',
          transition: transitions.fast,
          '&:hover': {
            color: intelligence.cerulean,
            textDecoration: 'underline',
          },
          '&:focus-visible': {
            outline: `${borders.width.medium} solid`,
            outlineColor: intelligence.cerulean,
            outlineOffset: spacing.xs,
            borderRadius: borders.radius.xs,
          },
        },
      },
    },

    // ========================================================================
    // APP BAR - Top navigation
    // ========================================================================
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: `rgba(10, 14, 39, 0.95)`, // Black Pearl with transparency
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: shadows.sm,
          borderBottom: `${borders.width.thin} solid ${borders.color.default}`,
          color: '#FFFFFF',
        },
      },
    },

    // ========================================================================
    // CHIP - Status indicators
    // ========================================================================
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borders.radius.full,
          fontWeight: typography.fontWeight.medium,
          fontSize: typography.fontSize.bodyTiny,
          height: components.chip.height,
          padding: components.chip.padding,
        },
        colorSuccess: {
          backgroundColor: semantic.successBg,
          color: semantic.successText,
        },
        colorWarning: {
          backgroundColor: semantic.warningBg,
          color: semantic.warningText,
        },
        colorError: {
          backgroundColor: semantic.errorBg,
          color: semantic.errorText,
        },
        colorInfo: {
          backgroundColor: semantic.infoBg,
          color: semantic.infoText,
        },
      },
    },

    // ========================================================================
    // DRAWER - Sidebar navigation
    // ========================================================================
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: base.blackPearl,
          borderRight: `${borders.width.thin} solid ${borders.color.default}`,
          color: '#FFFFFF',
        },
      },
    },

    // ========================================================================
    // TABLE - Enterprise data tables (dark variant)
    // ========================================================================
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: base.blackPearlLighter,
          '& .MuiTableCell-head': {
            fontWeight: typography.fontWeight.semibold,
            color: '#FFFFFF',
            fontSize: typography.fontSize.data,
            borderBottom: `${borders.width.medium} solid ${borders.color.strong}`,
            padding: dataTable.cellPadding,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: transitions.fast,
          '&:hover': {
            backgroundColor: base.blackPearlLighter,
          },
          '&:nth-of-type(even)': {
            backgroundColor: base.blackPearlLight,
            '&:hover': {
              backgroundColor: base.blackPearlLighter,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `${borders.width.thin} solid ${borders.color.default}`,
          padding: dataTable.cellPadding,
          fontSize: typography.fontSize.data,
          color: base.neutral200,
        },
      },
    },

    // ========================================================================
    // DIVIDER
    // ========================================================================
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: borders.color.default,
        },
      },
    },

    // ========================================================================
    // LIST ITEM
    // ========================================================================
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: borders.radius.md,
          transition: transitions.fast,
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 123, 167, 0.2)',
            color: intelligence.ceruleanLight,
            borderLeft: `${borders.width.thick} solid ${intelligence.cerulean}`,
            '&:hover': {
              backgroundColor: 'rgba(0, 123, 167, 0.3)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 123, 167, 0.1)',
          },
        },
      },
    },
  },
});

// ============================================================================
// EXPORT DESIGN TOKENS FOR COMPONENT USE
// ============================================================================

export { designTokens };

// Legacy exports for backward compatibility
export const blueSteelColors = {
  dark: intelligence.ceruleanDark,
  mid: intelligence.cerulean,
  light: intelligence.ceruleanLight,
  accent: intelligence.azure,
  bgMain: base.blackPearl,
  bgSecondary: base.blackPearlLight,
  bgCard: base.blackPearlLight,
};

export const gradients = {
  primary: intelligence.intelligenceGradient,
  light: intelligence.intelligenceGradientLight,
  dark: intelligence.intelligenceGradientDark,
};