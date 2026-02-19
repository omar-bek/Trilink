import { Box, Tooltip } from '@mui/material';

/**
 * UAE Government Flag Component
 * 
 * Professional flag representation using official UAE colors.
 * Maintains proper aspect ratio and visual hierarchy.
 */
interface UAEGovernmentFlagProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  variant?: 'full' | 'minimal';
}

const sizeMap = {
  small: { width: 24, height: 16 },
  medium: { width: 32, height: 21 },
  large: { width: 48, height: 32 },
};

export const UAEGovernmentFlag = ({ 
  size = 'medium',
  showTooltip = true,
  variant = 'full'
}: UAEGovernmentFlagProps) => {
  const dimensions = sizeMap[size];
  
  // Official UAE flag colors
  const flagColors = {
    black: '#000000',
    white: '#FFFFFF',
    green: '#00843D', // Official UAE green
    red: '#FF0000', // Official UAE red
  };

  const flagContent = (
    <Box
      sx={{
        width: dimensions.width,
        height: dimensions.height,
        position: 'relative',
        borderRadius: variant === 'minimal' ? 0.5 : 0,
        overflow: 'hidden',
        border: variant === 'minimal' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        boxShadow: variant === 'minimal' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
        flexShrink: 0,
      }}
      aria-label="United Arab Emirates Flag"
      role="img"
    >
      {/* UAE Flag: Horizontal stripes */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '33.33%',
          backgroundColor: flagColors.black,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '33.33%',
          left: 0,
          width: '100%',
          height: '33.33%',
          backgroundColor: flagColors.white,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '66.66%',
          left: 0,
          width: '100%',
          height: '33.33%',
          backgroundColor: flagColors.green,
        }}
      />
      {/* Vertical red stripe on the left */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '25%',
          height: '100%',
          backgroundColor: flagColors.red,
        }}
      />
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        title="United Arab Emirates"
        arrow
        placement="top"
      >
        {flagContent}
      </Tooltip>
    );
  }

  return flagContent;
};
