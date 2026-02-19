import { Chip, Tooltip } from '@mui/material';
import { VisibilityOff } from '@mui/icons-material';

interface AnonymousBadgeProps {
  anonymous: boolean;
}

export const AnonymousBadge = ({ anonymous }: AnonymousBadgeProps) => {
  if (!anonymous) return null;

  return (
    <Tooltip title="Buyer identity is hidden in this RFQ">
      <Chip
        icon={<VisibilityOff />}
        label="Anonymous Buyer"
        size="small"
        color="info"
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    </Tooltip>
  );
};
