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
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  AttachMoney,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Payment } from '@/types/payment';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatCurrency, formatDate } from '@/utils';
import { isValidId } from '@/utils/routeValidation';

interface PaymentListItemProps {
  payment: Payment;
}

export const PaymentListItem = ({ payment }: PaymentListItemProps) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    const paymentId = payment._id || payment.id;
    if (paymentId && isValidId(paymentId)) {
      navigate(`/payments/${paymentId}`);
    } else {
      console.warn('Invalid payment ID:', paymentId);
    }
    handleMenuClose();
  };

  const isOverdue = new Date(payment.dueDate) < new Date() && payment.status !== 'completed';

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease-in-out',
        borderLeft: isOverdue ? '4px solid' : 'none',
        borderColor: isOverdue ? '#ef4444' : 'transparent',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 15, 38, 0.12)',
        },
      }}
      onClick={() => {
        const paymentId = payment._id || payment.id;
        if (paymentId && isValidId(paymentId)) {
          navigate(`/payments/${paymentId}`);
        } else {
          console.warn('Invalid payment ID:', paymentId);
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {payment.milestone}
              </Typography>
              <PaymentStatusBadge status={payment.status} />
              {isOverdue && (
                <Chip label="Overdue" size="small" color="error" />
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AttachMoney fontSize="small" color="action" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(payment.totalAmount || payment.amount, payment.currency)}
                  </Typography>
                </Box>
                {payment.vatAmount && payment.vatAmount > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                    Subtotal: {formatCurrency(payment.amount, payment.currency)} + VAT ({((payment.vatRate || 0.05) * 100).toFixed(0)}%): {formatCurrency(payment.vatAmount, payment.currency)}
                  </Typography>
                )}
              </Box>
              <Chip
                label={`Due: ${formatDate(payment.dueDate)}`}
                size="small"
                variant="outlined"
                color={isOverdue ? 'error' : 'default'}
              />
              {payment.paidDate && (
                <Chip
                  label={`Paid: ${formatDate(payment.paidDate)}`}
                  size="small"
                  variant="outlined"
                  color="success"
                />
              )}
            </Box>
            {payment.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {payment.notes}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 1 }}
          >
            <MoreVert />
          </IconButton>
        </Box>
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
        </Menu>
      </CardContent>
    </Card>
  );
};
