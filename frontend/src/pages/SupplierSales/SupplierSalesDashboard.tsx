import { Box, Typography, Grid, Card, CardContent, Button, Chip, LinearProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Assignment,
  Gavel,
  Chat,
  AccountBalance,
  Timeline,
  Payment,
  Visibility,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { rfqService } from '@/services/rfq.service';
import { bidService } from '@/services/bid.service';
import { contractService } from '@/services/contract.service';
import { paymentService } from '@/services/payment.service';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/utils';
import { isValidId } from '@/utils/routeValidation';
import { RFQStatus } from '@/types/rfq';
import { BidStatus } from '@/types/bid';
import { ContractStatus } from '@/types/contract';
import { Role } from '@/types';
import { PaymentStatus } from '@/types/payment';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { RFQStatusBadge } from '@/components/RFQ/RFQStatusBadge';
import { BidStatusBadge } from '@/components/Bid/BidStatusBadge';
import { ContractStatusBadge } from '@/components/Contract/ContractStatusBadge';
import { PaymentStatusBadge } from '@/components/Payment/PaymentStatusBadge';

export const SupplierSalesDashboard = () => {
  const navigate = useNavigate();

  // Fetch Active RFQs (anonymous)
  const { data: activeRFQsData, isLoading: isLoadingRFQs } = useQuery({
    queryKey: queryKeys.rfqs.list({ status: RFQStatus.OPEN, targetRole: Role.SUPPLIER }),
    queryFn: () => rfqService.getAvailableRFQs({ status: RFQStatus.OPEN, targetRole: Role.SUPPLIER }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch Submitted Bids
  const { data: submittedBidsData, isLoading: isLoadingBids } = useQuery({
    queryKey: queryKeys.bids.list({ status: BidStatus.SUBMITTED }),
    queryFn: () => bidService.getBids({ status: BidStatus.SUBMITTED }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch Bids Under Review (Negotiations in progress)
  const { data: negotiationsData, isLoading: isLoadingNegotiations } = useQuery({
    queryKey: queryKeys.bids.list({ status: BidStatus.UNDER_REVIEW }),
    queryFn: () => bidService.getBids({ status: BidStatus.UNDER_REVIEW }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch Awarded Contracts
  const { data: contractsData, isLoading: isLoadingContracts } = useQuery({
    queryKey: queryKeys.contracts.list({ status: ContractStatus.ACTIVE }),
    queryFn: () => contractService.getContracts({ status: ContractStatus.ACTIVE }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch Payments
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: queryKeys.payments.list(),
    queryFn: () => paymentService.getPayments(),
    staleTime: 2 * 60 * 1000,
  });

  const activeRFQs = activeRFQsData?.data && Array.isArray(activeRFQsData.data) 
    ? activeRFQsData.data 
    : (activeRFQsData?.data as any)?.items || [];
  const submittedBids = submittedBidsData?.data && Array.isArray(submittedBidsData.data)
    ? submittedBidsData.data
    : (submittedBidsData?.data as any)?.items || [];
  const negotiations = negotiationsData?.data && Array.isArray(negotiationsData.data)
    ? negotiationsData.data
    : (negotiationsData?.data as any)?.items || [];
  const contracts = contractsData?.data && Array.isArray(contractsData.data)
    ? contractsData.data
    : (contractsData?.data as any)?.items || [];
  const payments = paymentsData?.data && Array.isArray(paymentsData.data)
    ? paymentsData.data
    : (paymentsData?.data as any)?.items || [];

  const isLoading = isLoadingRFQs || isLoadingBids || isLoadingNegotiations || isLoadingContracts || isLoadingPayments;

  if (isLoading) {
    return <PageSkeleton />;
  }

  // Calculate payment statistics
  const totalInvoiced = payments
    .filter((p: any) => p.status === PaymentStatus.PENDING_APPROVAL || p.status === PaymentStatus.APPROVED)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const pendingPayments = payments.filter((p: any) => p.status === PaymentStatus.PENDING_APPROVAL).length;
  const approvedPayments = payments.filter((p: any) => p.status === PaymentStatus.APPROVED).length;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Supplier Sales Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your RFQs, bids, contracts, and payments in one place
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Assignment />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {activeRFQs.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active RFQs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Gavel />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {submittedBids.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submitted Bids
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'warning.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Chat />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {negotiations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Negotiations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountBalance />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {contracts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Contracts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active RFQs Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assignment fontSize="small" />
                  Active RFQs
                </Typography>
                <Button size="small" onClick={() => navigate('/rfqs')}>
                  View All
                </Button>
              </Box>
              {activeRFQs.length === 0 ? (
                <Alert severity="info">No active RFQs available</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activeRFQs.slice(0, 5).map((rfq: any) => (
                    <Card
                      key={rfq._id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/rfqs/${rfq._id}`)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                            {rfq.title}
                          </Typography>
                          <RFQStatusBadge status={rfq.status} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Budget:</strong> {formatCurrency(rfq.budget, rfq.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Deadline:</strong> {formatDate(rfq.deadline)}
                          </Typography>
                        </Box>
                        {rfq.anonymousBuyer && (
                          <Chip
                            icon={<Visibility />}
                            label="Anonymous Buyer"
                            size="small"
                            sx={{ mt: 1 }}
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Submitted Bids Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Gavel fontSize="small" />
                  Submitted Bids
                </Typography>
                <Button size="small" onClick={() => navigate('/bids')}>
                  View All
                </Button>
              </Box>
              {submittedBids.length === 0 ? (
                <Alert severity="info">No submitted bids</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {submittedBids.slice(0, 5).map((bid: any) => (
                    <Card
                      key={bid._id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/bids/${bid._id}`)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                            Bid #{bid._id.slice(-6)}
                          </Typography>
                          <BidStatusBadge status={bid.status} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Price:</strong> {formatCurrency(bid.price, bid.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Delivery:</strong> {formatDate(bid.deliveryDate)}
                          </Typography>
                        </Box>
                        {bid.aiScore !== undefined && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUp fontSize="small" color="success" />
                            <Typography variant="caption" color="text.secondary">
                              AI Score: {bid.aiScore.toFixed(1)}/100
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Negotiations in Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chat fontSize="small" />
                  Negotiations in Progress
                </Typography>
                <Button size="small" onClick={() => navigate('/bids?status=under_review')}>
                  View All
                </Button>
              </Box>
              {negotiations.length === 0 ? (
                <Alert severity="info">No active negotiations</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {negotiations.slice(0, 5).map((bid: any) => (
                    <Card
                      key={bid._id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/bids/${bid._id}/negotiate`)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                            Negotiation #{bid._id.slice(-6)}
                          </Typography>
                          <BidStatusBadge status={bid.status} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Price:</strong> {formatCurrency(bid.price, bid.currency)}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bids/${bid._id}/negotiate`);
                            }}
                          >
                            Open Negotiation Room
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Awarded Contracts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance fontSize="small" />
                  Awarded Contracts
                </Typography>
                <Button size="small" onClick={() => navigate('/contracts')}>
                  View All
                </Button>
              </Box>
              {contracts.length === 0 ? (
                <Alert severity="info">No active contracts</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {contracts.slice(0, 5).map((contract: any) => (
                    <Card
                      key={contract._id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/contracts/${contract._id}`)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                            {contract.title || `Contract #${contract._id.slice(-6)}`}
                          </Typography>
                          <ContractStatusBadge status={contract.status} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Value:</strong> {formatCurrency(contract.totalAmount, contract.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Start:</strong> {formatDate(contract.startDate)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Production & Delivery Timeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline fontSize="small" />
                Production & Delivery Timeline
              </Typography>
              {contracts.length === 0 ? (
                <Alert severity="info">No active contracts with delivery timelines</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {contracts.slice(0, 3).map((contract: any) => (
                    <Box key={contract._id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {contract.title || `Contract #${contract._id.slice(-6)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(contract.startDate)} - {contract.endDate ? formatDate(contract.endDate) : 'Ongoing'}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          contract.startDate && contract.endDate
                            ? ((new Date().getTime() - new Date(contract.startDate).getTime()) /
                                (new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime())) *
                              100
                            : 50
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          <Schedule fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          Delivery: {contract.deliveryDate ? formatDate(contract.deliveryDate) : 'TBD'}
                        </Typography>
                        <Chip
                          icon={<CheckCircle fontSize="small" />}
                          label="In Progress"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice & Payment Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Payment fontSize="small" />
                Invoice & Payment Status
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Invoiced
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalInvoiced, 'AED')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {pendingPayments}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {approvedPayments}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {payments.length === 0 ? (
                <Alert severity="info">No payments found</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {payments.slice(0, 3).map((payment: any) => (
                    <Card
                      key={payment._id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Invoice #{payment._id.slice(-6)}
                          </Typography>
                          <PaymentStatusBadge status={payment.status} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Amount:</strong> {formatCurrency(payment.amount, payment.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Due:</strong> {payment.dueDate ? formatDate(payment.dueDate) : 'N/A'}
                          </Typography>
                        </Box>
                        {payment.status === PaymentStatus.PENDING_APPROVAL && (
                          <Chip
                            icon={<Warning fontSize="small" />}
                            label="Action Required"
                            size="small"
                            color="warning"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/payments')}
              >
                View All Payments
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
