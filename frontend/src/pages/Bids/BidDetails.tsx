import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Cancel,
  CheckCircle,
  Close,
  Edit,
  Delete,
  CompareArrows,
} from '@mui/icons-material';
import { useBid, useWithdrawBid, useEvaluateBid, useUpdateBid, useDeleteBid, useRevealBidIdentity, useBidsByRFQ } from '@/hooks/useBids';
import { BidStatusBadge } from '@/components/Bid/BidStatusBadge';
import { EnhancedStatusBadge } from '@/components/Workflow/EnhancedStatusBadge';
import { WhatsNext } from '@/components/Workflow/WhatsNext';
import { AIScoreIndicator } from '@/components/Bid/AIScoreIndicator';
import { AIScoreBreakdown } from '@/components/Bid/AIScoreBreakdown';
import { AIDisclaimer } from '@/components/Bid/AIDisclaimer';
import { AIExplanationSummary } from '@/components/Bid/AIExplanationSummary';
import { BidStatusLifecycle } from '@/components/Bid/BidStatusLifecycle';
import { AnonymousBadge } from '@/components/Anonymity/AnonymousBadge';
import { IdentityRevealModal } from '@/components/Anonymity/IdentityRevealModal';
import { ActivityHistory } from '@/components/Audit/ActivityHistory';
import { formatCurrency, formatDate, formatDateTime, isValidId } from '@/utils';
import { calculateVAT } from '@/utils/vat';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { BidStatus } from '@/types/bid';
import { ContractStatus } from '@/types/contract';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { useState, useEffect } from 'react';
import { Tabs, Tab } from '@mui/material';
import { WorkflowNextSteps, WorkflowIcons } from '@/components/Workflow/WorkflowNextSteps';
import { WorkflowLinks } from '@/components/Workflow/WorkflowLinks';
import { WorkflowStatusIndicator, WorkflowStep } from '@/components/Workflow/WorkflowStatusIndicator';
import { WorkflowNextStepsEnhanced } from '@/components/Workflow/WorkflowNextStepsEnhanced';
import { useQuery } from '@tanstack/react-query';
import { contractService } from '@/services/contract.service';

export const BidDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const isBuyer = role === Role.BUYER; // Only Buyer can evaluate bids (Admin/Government can view but not evaluate)
  const isAdmin = role === Role.ADMIN || role === Role.GOVERNMENT;
  const isProvider = role !== Role.BUYER && role !== Role.ADMIN && role !== Role.GOVERNMENT;
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [evaluateDialogOpen, setEvaluateDialogOpen] = useState(false);
  const [evaluateStatus, setEvaluateStatus] = useState<BidStatus | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const revealMutation = useRevealBidIdentity();

  // Validate ID - reject invalid values like "create", "new", etc.
  const validId = isValidId(id) ? id : undefined;

  // Redirect if ID is missing or invalid
  useEffect(() => {
    if (!isValidId(id)) {
      navigate('/bids', { replace: true });
    }
  }, [id, navigate]);

  if (!isValidId(id)) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid bid ID. Redirecting...
      </Alert>
    );
  }

  const { data, isLoading, error } = useBid(validId);
  const withdrawMutation = useWithdrawBid();
  const evaluateMutation = useEvaluateBid();
  const updateMutation = useUpdateBid();
  const deleteMutation = useDeleteBid();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const bid = data?.data;

  // Fetch other bids for the same RFQ for comparison (only for buyers)
  const { data: otherBidsData } = useBidsByRFQ(
    isBuyer && bid?.rfqId ? bid.rfqId : undefined,
    { status: 'submitted' }
  );
  const otherBids = otherBidsData?.data || [];
  const otherBidsCount = bid ? otherBids.filter((b: any) => (b._id || b.id) !== (bid._id || bid.id)).length : 0;

  // Fetch contract if bid is accepted (contract is auto-created)
  const { data: contractsData } = useQuery({
    queryKey: ['contracts-by-bid', id],
    queryFn: async () => {
      // Fetch all contracts and filter by bidId in parties
      const response = await contractService.getContracts();
      const contracts = Array.isArray(response.data) ? response.data : response.data.data || [];
      return contracts.filter((contract: any) =>
        contract.parties?.some((party: any) => party.bidId === id || party.bidId === bid?._id)
      );
    },
    enabled: !!id && bid?.status === BidStatus.ACCEPTED,
    staleTime: 2 * 60 * 1000,
  });

  const relatedContract = contractsData && contractsData.length > 0 ? contractsData[0] : null;
  const isBidOwner = user?.companyId === bid?.companyId;
  const canRevealIdentity = bid?.anonymousBidder && (isBuyer || isAdmin || isBidOwner);
  const canWithdraw = bid?.status === BidStatus.SUBMITTED && isProvider;
  const canEvaluate = isBuyer && (bid?.status === BidStatus.SUBMITTED || bid?.status === BidStatus.UNDER_REVIEW);
  const canEdit = isProvider && (bid?.status === BidStatus.DRAFT || bid?.status === BidStatus.SUBMITTED);
  const canDelete = isProvider && bid?.status === BidStatus.DRAFT;
  const canCompare = isBuyer && bid?.rfqId; // Only buyers can compare bids, and RFQ ID must exist

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !bid) {
    return (
      <Alert severity="error">
        Failed to load bid. Please try again.
      </Alert>
    );
  }

  const handleWithdraw = () => {
    withdrawMutation.mutate(validId!, {
      onSuccess: () => {
        setWithdrawDialogOpen(false);
        navigate('/bids');
      },
    });
  };

  const handleEvaluate = () => {
    if (evaluateStatus) {
      evaluateMutation.mutate(
        { id: validId!, data: { status: evaluateStatus } },
        {
          onSuccess: () => {
            setEvaluateDialogOpen(false);
            setEvaluateStatus(null);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(validId!, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        navigate('/bids');
      },
    });
  };

  const handleWorkflowAction = (action: string) => {
    if (action === 'submit' && validId) {
      updateMutation.mutate(
        { id: validId, data: { status: BidStatus.SUBMITTED } },
        {
          onSuccess: () => {
            // Query will be invalidated automatically
          },
        }
      );
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bids')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Bid #{(bid.id || bid._id || validId || '').slice(-6)}
            </Typography>
            <EnhancedStatusBadge entityType="bid" status={bid.status} showContext />
            <AnonymousBadge isAnonymous={bid.anonymousBidder} />
            {bid.aiScore !== undefined || bid.aiScoreMetadata ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AIScoreIndicator
                  score={bid.aiScore}
                  aiMetadata={bid.aiScoreMetadata ? {
                    totalScore: bid.aiScoreMetadata.totalScore,
                    breakdown: bid.aiScoreMetadata.breakdown,
                    overallConfidence: bid.aiScoreMetadata.overallConfidence as 'high' | 'medium' | 'low',
                    overallRisk: bid.aiScoreMetadata.overallRisk as 'low' | 'medium' | 'high',
                    recommendation: bid.aiScoreMetadata.recommendation,
                    timestamp: bid.aiScoreMetadata.timestamp ? new Date(bid.aiScoreMetadata.timestamp) : undefined,
                    modelVersion: bid.aiScoreMetadata.modelVersion,
                  } : undefined}
                />
              </Box>
            ) : null}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Created {formatDateTime(bid.createdAt)}
          </Typography>
        </Box>
        {canWithdraw && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => setWithdrawDialogOpen(true)}
            disabled={withdrawMutation.isPending}
          >
            Withdraw Bid
          </Button>
        )}
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => validId && navigate(`/bids/${validId}/edit`)}
          >
            Edit
          </Button>
        )}
        {canEvaluate && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => {
                setEvaluateStatus(BidStatus.ACCEPTED);
                setEvaluateDialogOpen(true);
              }}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Close />}
              onClick={() => {
                setEvaluateStatus(BidStatus.REJECTED);
                setEvaluateDialogOpen(true);
              }}
            >
              Reject
            </Button>
          </Box>
        )}
        {canDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        )}
        {canCompare && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CompareArrows />}
            onClick={() => navigate(`/rfqs/${bid.rfqId}/bids/compare`)}
          >
            Compare Bids
          </Button>
        )}
      </Box>

      {/* Anonymous Badge and Reveal Control */}
      {bid.anonymousBidder && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnonymousBadge isAnonymous={bid.anonymousBidder} />
              <Typography variant="body2">
                This bid is submitted anonymously. Bidder identity will be revealed upon contract award.
              </Typography>
            </Box>
            {canRevealIdentity && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => setRevealModalOpen(true)}
                disabled={revealMutation.isPending}
              >
                Reveal Identity
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {/* What's Next Component */}
      <WhatsNext
        entityType="bid"
        status={bid.status}
        entityId={validId}
        onAction={handleWorkflowAction}
        customPath={bid.status === BidStatus.ACCEPTED ? `/contracts/create?bidId=${id}` : undefined}
      />

      {/* Legacy Workflow Next Steps - Keep for backward compatibility */}
      {bid.status === BidStatus.ACCEPTED && isBuyer && (
        <WorkflowNextSteps
          title="Next Steps: Create Contract"
          steps={[
            {
              id: 'create-contract',
              title: 'Create Contract from Accepted Bid',
              description: 'Create a contract using this accepted bid. You can include multiple accepted bids in one contract.',
              action: {
                label: 'Create Contract',
                path: `/contracts/create?bidId=${id}`,
              },
              icon: WorkflowIcons.Contract,
              required: true,
            },
          ]}
        />
      )}

      {bid.status === BidStatus.SUBMITTED && isProvider && (
        <WorkflowNextSteps
          title="Bid Submitted"
          steps={[
            {
              id: 'wait-evaluation',
              title: 'Waiting for Buyer Evaluation',
              description: 'Your bid has been submitted. The buyer will review and evaluate it.',
              action: {
                label: 'View Bid Status',
                path: `/bids/${id}`,
                variant: 'outlined',
              },
              required: false,
            },
          ]}
        />
      )}

      {bid.status === BidStatus.REJECTED && isProvider && (
        <WorkflowNextSteps
          title="Bid Rejected"
          completed={true}
          completedMessage="This bid has been rejected by the buyer."
        />
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Bid Items with Pricing */}
          {bid.items && bid.items.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Bid Items & Pricing
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bid.items.map((item, index) => {
                        const itemTotal = item.quantity * item.price;
                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {item.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {item.quantity} {item.unit}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatCurrency(item.price, bid.currency)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {formatCurrency(itemTotal, bid.currency)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 600 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Subtotal:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatCurrency(bid.price, bid.currency)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {bid.price > 0 && (() => {
                        const vatBreakdown = calculateVAT(bid.price, 0.05, bid.currency);
                        return (
                          <>
                            <TableRow>
                              <TableCell colSpan={3} align="right">
                                <Typography variant="body2" color="text.secondary">
                                  VAT (5%):
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">
                                  {formatCurrency(vatBreakdown.vatAmount, bid.currency)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: 'primary.light', '& .MuiTableCell-root': { borderTop: '2px solid', borderColor: 'primary.main' } }}>
                              <TableCell colSpan={3} align="right" sx={{ fontWeight: 700 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  Total (incl. VAT):
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {formatCurrency(vatBreakdown.total, bid.currency)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Payment Terms
                </Typography>
                {bid.anonymousBidder && <AnonymousBadge isAnonymous={bid.anonymousBidder} />}
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {bid.paymentTerms}
              </Typography>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          {bid.paymentSchedule && bid.paymentSchedule.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Payment Schedule
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Milestone</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                        {bid.paymentSchedule.some((p: any) => p.description) && (
                          <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bid.paymentSchedule.map((payment: any, index: number) => {
                        const amount = payment.amount || (bid.price && payment.percentage 
                          ? (bid.price * payment.percentage) / 100 
                          : 0);
                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {payment.milestone}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {payment.percentage ? `${payment.percentage.toFixed(2)}%` : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {amount > 0 ? formatCurrency(amount, bid.currency) : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {payment.dueDate ? formatDate(payment.dueDate) : '-'}
                              </Typography>
                            </TableCell>
                            {bid.paymentSchedule.some((p: any) => p.description) && (
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {payment.description || '-'}
                                </Typography>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={bid.paymentSchedule.some((p: any) => p.description) ? 2 : 1} align="right" sx={{ fontWeight: 600 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Total:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {bid.paymentSchedule.reduce((sum: number, p: any) => {
                              const percentage = parseFloat(p.percentage) || 0;
                              return sum + (bid.price ? (bid.price * percentage) / 100 : 0);
                            }, 0).toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatCurrency(
                              bid.paymentSchedule.reduce((sum: number, p: any) => {
                                const amount = p.amount || (bid.price && p.percentage 
                                  ? (bid.price * p.percentage) / 100 
                                  : 0);
                                return sum + amount;
                              }, 0),
                              bid.currency
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={bid.paymentSchedule.some((p: any) => p.description) ? 1 : 0} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Bid Price: {formatCurrency(bid.price, bid.currency)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Compare Bids Section - Only for Buyers */}
          {canCompare && otherBidsCount > 0 && (
            <Card sx={{ mb: 3, bgcolor: 'primary.light', border: '1px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Compare with Other Bids
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {otherBidsCount} other submitted bid{otherBidsCount !== 1 ? 's' : ''} available for comparison
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CompareArrows />}
                    onClick={() => navigate(`/rfqs/${bid.rfqId}/bids/compare`)}
                    sx={{ minWidth: 160 }}
                  >
                    Compare Bids
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* AI Score Explanation - Comprehensive & Audit-Safe */}
          {bid.aiScoreMetadata && (
            <>
              <AIExplanationSummary
                totalScore={bid.aiScoreMetadata.totalScore}
                breakdown={bid.aiScoreMetadata.breakdown}
                overallConfidence={bid.aiScoreMetadata.overallConfidence as 'high' | 'medium' | 'low'}
                overallRisk={bid.aiScoreMetadata.overallRisk as 'low' | 'medium' | 'high'}
                recommendation={bid.aiScoreMetadata.recommendation}
                timestamp={bid.aiScoreMetadata.timestamp ? new Date(bid.aiScoreMetadata.timestamp) : undefined}
                modelVersion={bid.aiScoreMetadata.modelVersion}
                variant="detailed"
                showDisclaimer={true}
                showModelInfo={true}
              />
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Detailed Score Breakdown by Factor
                  </Typography>
                  <AIScoreBreakdown
                    totalScore={bid.aiScoreMetadata.totalScore}
                    breakdown={bid.aiScoreMetadata.breakdown}
                    overallConfidence={bid.aiScoreMetadata.overallConfidence as 'high' | 'medium' | 'low'}
                    overallRisk={bid.aiScoreMetadata.overallRisk as 'low' | 'medium' | 'high'}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Status Lifecycle */}
          <Card>
            <CardContent>
              <BidStatusLifecycle
                status={bid.status}
                createdAt={bid.createdAt}
                updatedAt={bid.updatedAt}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Bid Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Price
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(bid.price, bid.currency)}
                  </Typography>
                  {bid.items && bid.items.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {bid.items.length} item{bid.items.length !== 1 ? 's' : ''}
                    </Typography>
                  )}
                  {bid.price > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {(() => {
                        const vatBreakdown = calculateVAT(bid.price, 0.05, bid.currency);
                        return (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Subtotal: {formatCurrency(vatBreakdown.subtotal, bid.currency)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              VAT (5%): {formatCurrency(vatBreakdown.vatAmount, bid.currency)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                              Total (incl. VAT): {formatCurrency(vatBreakdown.total, bid.currency)}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Delivery Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {bid.deliveryTime} days
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Delivery Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(bid.deliveryDate)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Bid Validity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(bid.validity)}
                  </Typography>
                </Box>
                <Divider />
                {bid.anonymousBidder && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Bidder Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AnonymousBadge isAnonymous={bid.anonymousBidder} />
                      </Box>
                    </Box>
                  </>
                )}
                {bid.attachments && bid.attachments.length > 0 && (
                  <>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Attachments
                      </Typography>
                      {bid.attachments.map((attachment, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {attachment.type}
                        </Typography>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflow Status Indicator - Show what happens after bid acceptance */}
      {bid.status === BidStatus.ACCEPTED && (
        <WorkflowStatusIndicator
          title="Workflow Status: After Bid Acceptance"
          steps={[
            {
              id: 'bid-accepted',
              label: 'Bid Accepted',
              status: 'completed',
              description: 'Your bid has been accepted by the buyer',
              timestamp: bid.updatedAt,
            },
            {
              id: 'contract-created',
              label: 'Contract Auto-Generated',
              status: relatedContract ? 'completed' : 'pending',
              description: relatedContract
                ? 'A contract has been automatically created from this accepted bid'
                : 'A contract will be automatically created from this accepted bid',
              entityId: relatedContract?._id || relatedContract?.id,
              entityType: 'contract',
              timestamp: relatedContract?.createdAt,
              metadata: relatedContract
                ? {
                    amount: relatedContract.amounts?.total,
                    currency: relatedContract.amounts?.currency,
                    status: relatedContract.status,
                  }
                : undefined,
            },
            {
              id: 'contract-signing',
              label: 'Contract Signing',
              status: relatedContract
                ? relatedContract.status === ContractStatus.PENDING_SIGNATURES
                  ? 'active'
                  : relatedContract.status === ContractStatus.SIGNED || relatedContract.status === ContractStatus.ACTIVE
                  ? 'completed'
                  : 'pending'
                : 'not_started',
              description:
                relatedContract?.status === ContractStatus.PENDING_SIGNATURES
                  ? 'All parties need to sign the contract'
                  : relatedContract?.status === ContractStatus.SIGNED || relatedContract?.status === ContractStatus.ACTIVE
                  ? 'Contract has been signed by all parties'
                  : 'Waiting for contract to be created',
              entityId: relatedContract?._id || relatedContract?.id,
              entityType: 'contract',
            },
            {
              id: 'contract-activation',
              label: 'Contract Activation',
              status: relatedContract
                ? relatedContract.status === ContractStatus.ACTIVE
                  ? 'completed'
                  : relatedContract.status === ContractStatus.SIGNED
                  ? 'pending'
                  : 'not_started'
                : 'not_started',
              description:
                relatedContract?.status === ContractStatus.ACTIVE
                  ? 'Contract is active and payments/shipments can be created'
                  : relatedContract?.status === ContractStatus.SIGNED
                  ? 'Waiting for buyer to activate the contract'
                  : 'Waiting for contract to be signed',
              entityId: relatedContract?._id || relatedContract?.id,
              entityType: 'contract',
            },
            {
              id: 'payments-created',
              label: 'Payments Scheduled',
              status: relatedContract?.status === ContractStatus.ACTIVE ? 'pending' : 'not_started',
              description:
                relatedContract?.status === ContractStatus.ACTIVE
                  ? 'Payments will be created automatically from the payment schedule'
                  : 'Payments will be created once contract is activated',
            },
            {
              id: 'shipments-created',
              label: 'Shipments Created',
              status: 'not_started',
              description: 'Shipments can be created once contract is active and goods are ready',
            },
          ]}
        />
      )}

      {/* Contract Link - Show when bid is accepted */}
      {bid.status === BidStatus.ACCEPTED && relatedContract && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                navigate(`/contracts/${relatedContract._id || relatedContract.id}`);
              }}
            >
              View Contract
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Bid Accepted - Contract Created
          </Typography>
          <Typography variant="body2">
            A contract has been automatically created from this accepted bid. Click to view the contract details.
          </Typography>
        </Alert>
      )}

      {/* Activity History Tab */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Activity History" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Details content is already shown above */}
            </Box>
          )}
          {activeTab === 1 && id && (
            <ActivityHistory
              resource="bid"
              resourceId={id}
              title="Bid Activity History"
              showExport={true}
            />
          )}
        </Box>
      </Box>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)}>
        <DialogTitle>Withdraw Bid</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to withdraw this bid? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleWithdraw} color="error" variant="contained">
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>

      {/* Evaluate Dialog */}
      <Dialog open={evaluateDialogOpen} onClose={() => setEvaluateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {evaluateStatus === BidStatus.ACCEPTED ? 'Accept Bid' : 'Reject Bid'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to {evaluateStatus === BidStatus.ACCEPTED ? 'accept' : 'reject'} this bid?
          </DialogContentText>
          {evaluateStatus === BidStatus.ACCEPTED && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                What happens next:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <li>This bid will be marked as accepted</li>
                <li>You can create a contract using this accepted bid</li>
                <li>You can include multiple accepted bids in one contract</li>
                <li>The provider will be notified of the acceptance</li>
              </Box>
            </Alert>
          )}
          {evaluateStatus === BidStatus.REJECTED && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Note:
              </Typography>
              <Typography variant="body2">
                The provider will be notified that their bid has been rejected. You can continue evaluating other bids for this RFQ.
              </Typography>
            </Alert>
          )}
          {evaluateMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {evaluateMutation.error?.response?.data?.message || 'Failed to evaluate bid'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEvaluate}
            color={evaluateStatus === BidStatus.ACCEPTED ? 'success' : 'error'}
            variant="contained"
            disabled={evaluateMutation.isPending}
          >
            {evaluateMutation.isPending
              ? evaluateStatus === BidStatus.ACCEPTED
                ? 'Accepting...'
                : 'Rejecting...'
              : evaluateStatus === BidStatus.ACCEPTED
              ? 'Accept Bid'
              : 'Reject Bid'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Bid</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this bid? This action cannot be undone.
          </DialogContentText>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteMutation.error?.response?.data?.message || 'Failed to delete bid'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Identity Reveal Modal */}
      <IdentityRevealModal
        open={revealModalOpen}
        onClose={() => setRevealModalOpen(false)}
        onConfirm={() => {
          if (id) {
            revealMutation.mutate(id, {
              onSuccess: () => {
                setRevealModalOpen(false);
              },
            });
          }
        }}
        resourceType="Bid"
        resourceTitle={`Bid #${(bid._id || bid.id || id || '').slice(-6)}`}
        isPending={revealMutation.isPending}
      />
    </Box>
  );
};
