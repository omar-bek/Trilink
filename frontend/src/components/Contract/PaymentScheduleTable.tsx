import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Contract, PaymentMilestone } from '@/types/contract';
import { Payment, PaymentStatus } from '@/types/payment';
import { formatCurrency, formatDate } from '@/utils';
import { isValidId } from '@/utils/routeValidation';
import { PaymentStatusBadge } from '@/components/Payment/PaymentStatusBadge';

interface PaymentScheduleTableProps {
  contract: Contract;
  payments?: Payment[];
}

interface PaymentScheduleRow {
  milestone: string;
  status: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  vat: number;
  vatRate: number;
  notes?: string;
  currency: string;
  paymentId?: string; // Payment ID for navigation
}

export const PaymentScheduleTable = ({ contract, payments = [] }: PaymentScheduleTableProps) => {
  const navigate = useNavigate();
  
  // Group payments by milestone
  const paymentsByMilestone = payments.reduce((acc, payment) => {
    if (!acc[payment.milestone]) {
      acc[payment.milestone] = [];
    }
    acc[payment.milestone].push(payment);
    return acc;
  }, {} as Record<string, Payment[]>);

  // Create rows from payment schedule and match with actual payments
  const createRows = (): PaymentScheduleRow[] => {
    const schedule = contract.paymentSchedule || [];
    const currency = contract.amounts?.currency || 'AED';
    const vatRate = 0.05; // UAE VAT rate

    // If we have payments, create a row for each payment
    // Otherwise, create rows from the schedule
    if (payments.length > 0) {
      // Group by milestone and create rows for each payment
      const rows: PaymentScheduleRow[] = [];
      
      schedule.forEach((milestone: PaymentMilestone) => {
        const milestonePayments = paymentsByMilestone[milestone.milestone] || [];
        
        if (milestonePayments.length > 0) {
          // Create a row for each payment in this milestone
          milestonePayments.forEach((payment) => {
            const paymentVat = payment.vatAmount || (payment.amount * vatRate);
            const paymentTotal = payment.totalAmount || (payment.amount + paymentVat);
            
            // Determine status
            let displayStatus = payment.status;
            if (displayStatus === PaymentStatus.COMPLETED) {
              displayStatus = 'Completed';
            } else if (displayStatus === PaymentStatus.APPROVED) {
              displayStatus = 'Approved';
            } else if (displayStatus === PaymentStatus.PENDING_APPROVAL) {
              displayStatus = 'Pending Approval';
            } else {
              displayStatus = 'Pending Approval';
            }

            // Get valid payment ID - check both _id and id fields
            // API returns 'id' but frontend interface also supports '_id' for backward compatibility
            let paymentId: string | undefined;
            if (payment._id && typeof payment._id === 'string' && payment._id.trim() !== '' && payment._id !== 'undefined') {
              paymentId = payment._id.trim();
            } else if (payment.id && typeof payment.id === 'string' && payment.id.trim() !== '' && payment.id !== 'undefined') {
              paymentId = payment.id.trim();
            }
            const validPaymentId = paymentId && isValidId(paymentId) ? paymentId : undefined;
            
            rows.push({
              milestone: milestone.milestone,
              status: displayStatus,
              amount: payment.amount,
              dueDate: payment.dueDate || milestone.dueDate,
              paidDate: payment.paidDate,
              vat: paymentVat,
              vatRate: payment.vatRate || vatRate,
              notes: payment.notes || 'No notes',
              currency: payment.currency || currency,
              paymentId: validPaymentId, // Store valid payment ID for navigation
            });
          });
        } else {
          // No payments yet, show schedule milestone
          const totalVat = milestone.amount * vatRate;
          rows.push({
            milestone: milestone.milestone,
            status: milestone.status === 'completed' ? 'Completed' : 
                   milestone.status === 'approved' ? 'Approved' : 'Pending Approval',
            amount: milestone.amount,
            dueDate: milestone.dueDate,
            paidDate: undefined,
            vat: totalVat,
            vatRate,
            notes: 'No notes',
            currency,
          });
        }
      });
      
      return rows;
    } else {
      // No payments, just show schedule
      return schedule.map((milestone: PaymentMilestone) => {
        const totalVat = milestone.amount * vatRate;
        return {
          milestone: milestone.milestone,
          status: milestone.status === 'completed' ? 'Completed' : 
                 milestone.status === 'approved' ? 'Approved' : 'Pending Approval',
          amount: milestone.amount,
          dueDate: milestone.dueDate,
          paidDate: undefined,
          vat: totalVat,
          vatRate,
          notes: 'No notes',
          currency,
        };
      });
    }
  };

  const rows = createRows();

  if (rows.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No payment schedule available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Payment Schedule
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Milestone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Paid Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>VAT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow 
                key={index} 
                hover
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling to parent card
                  const paymentId = row.paymentId;
                  if (paymentId && typeof paymentId === 'string' && isValidId(paymentId)) {
                    navigate(`/payments/${paymentId}`);
                  } else {
                    console.warn('Invalid payment ID:', paymentId);
                  }
                }}
                sx={{
                  cursor: row.paymentId && isValidId(row.paymentId) ? 'pointer' : 'default',
                  '&:hover': row.paymentId && isValidId(row.paymentId) ? {
                    backgroundColor: 'action.hover',
                  } : {},
                }}
              >
                <TableCell>{row.milestone}</TableCell>
                <TableCell>
                  {row.status === 'Completed' ? (
                    <Chip label="Completed" color="success" size="small" />
                  ) : row.status === 'Approved' ? (
                    <Chip label="Approved" color="info" size="small" />
                  ) : row.status === 'Pending Approval' ? (
                    <Chip label="Pending Approval" color="warning" size="small" />
                  ) : (
                    <Chip label={row.status} size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(row.amount, row.currency)}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(row.dueDate)}</TableCell>
                <TableCell>
                  {row.paidDate ? formatDate(row.paidDate) : 'Not paid'}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(row.vat, row.currency)} ({Math.round(row.vatRate * 100)}%)
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.notes}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
