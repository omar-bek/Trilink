import { Box, Tooltip } from '@mui/material';
import { Verified } from '@mui/icons-material';

/**
 * UAE Government Seal Component
 * 
 * A subtle, professional indicator of official government authority.
 * Used sparingly in key locations to establish platform legitimacy.
 */
interface UAEGovernmentSealProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'badge' | 'minimal';
  showTooltip?: boolean;
}

const sizeMap = {
  small: { icon: 16, container: 24 },
  medium: { icon: 20, container: 32 },
  large: { icon: 24, container: 40 },
};

export const UAEGovernmentSeal = ({ 
  size = 'medium', 
  variant = 'icon',
  showTooltip = true 
}: UAEGovernmentSealProps) => {
  const dimensions = sizeMap[size];
  
  const sealContent = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: '50%',
        backgroundColor: variant === 'minimal' ? 'transparent' : 'rgba(0, 132, 61, 0.1)',
        border: variant === 'minimal' ? 'none' : '1px solid rgba(0, 132, 61, 0.2)',
        color: '#00843D',
      }}
      aria-label="UAE Government Official Platform"
    >
      {variant === 'minimal' ? (
        <Verified sx={{ fontSize: dimensions.icon }} />
      ) : (
        <Verified sx={{ fontSize: dimensions.icon }} />
      )}
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        title="Official UAE Government Digital Platform"
        arrow
        placement="top"
      >
        {sealContent}
      </Tooltip>
    );
  }

  return sealContent;
};
