import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  useTheme,
  Paper,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Payment,
  AccountBalance,
  Receipt,
} from '@mui/icons-material';

export type PaymentStage = 'pending' | 'approved' | 'processing' | 'completed' | 'failed';

export interface PaymentProgressBarProps {
  currentStage: PaymentStage;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  showDetails?: boolean;
}

const stageOrder: PaymentStage[] = ['pending', 'approved', 'processing', 'completed'];

const stageLabels: Record<PaymentStage, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const stageIcons: Record<PaymentStage, React.ReactElement> = {
  pending: <Schedule />,
  approved: <CheckCircle />,
  processing: <Payment />,
  completed: <Receipt />,
  failed: <AccountBalance />,
};

export const PaymentProgressBar: React.FC<PaymentProgressBarProps> = ({
  currentStage,
  amount,
  currency = 'USD',
  paymentMethod,
  transactionId,
  showDetails = true,
}) => {
  const theme = useTheme();
  const currentIndex = stageOrder.indexOf(currentStage);
  const progress = currentStage === 'failed' ? 0 : ((currentIndex + 1) / stageOrder.length) * 100;
  const isFailed = currentStage === 'failed';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Payment Status
            </Typography>
            <Typography variant="h4" fontWeight={700} color="primary">
              {formatCurrency(amount)}
            </Typography>
          </Box>
          <Chip
            label={stageLabels[currentStage]}
            color={isFailed ? 'error' : currentStage === 'completed' ? 'success' : 'primary'}
            icon={stageIcons[currentStage]}
            sx={{ height: 32 }}
          />
        </Box>

        {!isFailed && (
          <>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 10,
                borderRadius: theme.shape.borderRadius,
                backgroundColor: theme.palette.background.default,
                '& .MuiLinearProgress-bar': {
                  borderRadius: theme.shape.borderRadius,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {Math.round(progress)}% Complete
            </Typography>
          </>
        )}

        {isFailed && (
          <Box
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              backgroundColor: `${theme.palette.error.main}20`,
              border: `1px solid ${theme.palette.error.main}`,
            }}
          >
            <Typography variant="body2" color="error">
              Payment processing failed. Please try again or contact support.
            </Typography>
          </Box>
        )}
      </Box>

      {showDetails && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          {paymentMethod && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Payment Method
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {paymentMethod}
              </Typography>
            </Box>
          )}
          {transactionId && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Transaction ID
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                {transactionId}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};
