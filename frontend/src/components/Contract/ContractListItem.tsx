import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Description,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contract } from '@/types/contract';
import { ContractStatusBadge } from './ContractStatusBadge';
import { PaymentScheduleTable } from './PaymentScheduleTable';
import { formatCurrency, formatDate } from '@/utils';
import { usePaymentsByContract } from '@/hooks/usePayments';

interface ContractListItemProps {
  contract: Contract;
}

export const ContractListItem = ({ contract }: ContractListItemProps) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const open = Boolean(anchorEl);
  
  const contractId = contract._id || contract.id;
  // Only fetch payments when expanded to optimize performance
  const { data: paymentsData } = usePaymentsByContract(expanded ? contractId : undefined);
  const payments = paymentsData?.data || [];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    if (contract._id || contract.id) {
      navigate(`/contracts/${contract._id || contract.id}`);
    }
    handleMenuClose();
  };

  const contractIdDisplay = contract._id || contract.id || 'N/A';
  const signatures = contract.signatures || [];
  const parties = contract.parties || [];
  const signaturesProgress = `${signatures.length}/${parties.length}`;
  const allSigned = signatures.length === parties.length && parties.length > 0;
  const terms = contract.terms || '';
  
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 15, 38, 0.12)',
        },
      }}
      onClick={() => {
        if (contract._id || contract.id) {
          navigate(`/contracts/${contract._id || contract.id}`);
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Contract #{typeof contractIdDisplay === 'string' ? contractIdDisplay.slice(-6) : contractIdDisplay}
              </Typography>
              <ContractStatusBadge status={contract.status} />
              {contract.paymentSchedule && contract.paymentSchedule.length > 0 && (
                <IconButton
                  size="small"
                  onClick={handleToggleExpand}
                  sx={{ ml: 'auto' }}
                >
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>
            {terms && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {terms.length > 150 ? `${terms.substring(0, 150)}...` : terms}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {contract.amounts && (
                <Chip
                  label={formatCurrency(contract.amounts.total, contract.amounts.currency)}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
              {parties.length > 0 && (
                <Chip
                  label={`${parties.length} parties`}
                  size="small"
                  variant="outlined"
                />
              )}
              {parties.length > 0 && (
                <Chip
                  label={`Signatures: ${signaturesProgress}`}
                  size="small"
                  color={allSigned ? 'success' : 'warning'}
                  variant={allSigned ? 'filled' : 'outlined'}
                />
              )}
              {contract.startDate && (
                <Chip
                  label={`Start: ${formatDate(contract.startDate)}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {contract.endDate && (
                <Chip
                  label={`End: ${formatDate(contract.endDate)}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 1 }}
          >
            <MoreVert />
          </IconButton>
        </Box>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }} onClick={(e) => e.stopPropagation()}>
            <PaymentScheduleTable contract={contract} payments={payments} />
          </Box>
        </Collapse>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Description fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Contract</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};
