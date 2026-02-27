/**
 * Status Badge Component
 * 
 * Enterprise-grade status indicators
 * Clear, unambiguous status communication
 */

import { Chip, ChipProps } from '@mui/material';
import { designTokens } from '@/theme/designTokens';

const { colors, typography, borders } = designTokens;

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'critical';

export interface StatusBadgeProps extends Omit<ChipProps, 'color' | 'label'> {
  status: StatusType;
  label: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; border?: string; iconColor?: string }
> = {
  success: {
    bg: colors.semantic.successBg,
    text: colors.semantic.successText,
  },
  warning: {
    bg: colors.semantic.warningBg,
    text: colors.semantic.warningText,
  },
  error: {
    bg: colors.semantic.errorBg,
    text: colors.semantic.errorText,
  },
  info: {
    bg: colors.semantic.infoBg,
    text: colors.semantic.infoText,
  },
  neutral: {
    bg: colors.base.neutral100,
    text: colors.base.neutral700,
  },
  critical: {
    bg: colors.semantic.errorBg,
    text: colors.semantic.errorText,
  },
};

export const StatusBadge = ({
  status,
  label,
  variant = 'filled',
  size = 'small',
  sx,
  ...props
}: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        height: size === 'small' ? '24px' : '32px',
        fontSize: typography.fontSize.bodyTiny,
        fontWeight: typography.fontWeight.medium,
        borderRadius: borders.radius.full,
        backgroundColor: variant === 'filled' ? config.bg : 'transparent',
        color: variant === 'filled' ? config.text : config.bg,
        border: variant === 'outlined' ? `1px solid ${config.bg}` : 'none',
        ...sx,
      }}
      {...props}
    />
  );
};