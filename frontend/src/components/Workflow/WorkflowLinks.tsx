import {
  Box,
  Typography,
  Link,
  Chip,
  Stack,
} from '@mui/material';
import {
  Assignment,
  Gavel,
  Description,
  AttachMoney,
  ShoppingCart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export interface WorkflowLink {
  type: 'purchase_request' | 'rfq' | 'bid' | 'contract' | 'payment';
  id: string;
  label: string;
  status?: string;
}

interface WorkflowLinksProps {
  title?: string;
  links: WorkflowLink[];
}

const typeIcons = {
  purchase_request: <ShoppingCart fontSize="small" />,
  rfq: <Assignment fontSize="small" />,
  bid: <Gavel fontSize="small" />,
  contract: <Description fontSize="small" />,
  payment: <AttachMoney fontSize="small" />,
};

const typePaths = {
  purchase_request: '/purchase-requests',
  rfq: '/rfqs',
  bid: '/bids',
  contract: '/contracts',
  payment: '/payments',
};

export const WorkflowLinks = ({
  title = 'Related Items',
  links,
}: WorkflowLinksProps) => {
  const navigate = useNavigate();

  if (links.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {links.map((link) => (
          <Chip
            key={`${link.type}-${link.id}`}
            icon={typeIcons[link.type]}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {link.label}
                </Typography>
                {link.status && (
                  <Typography variant="caption" color="text.secondary">
                    ({link.status})
                  </Typography>
                )}
              </Box>
            }
            onClick={() => navigate(`${typePaths[link.type]}/${link.id}`)}
            clickable
            variant="outlined"
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};
