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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  CircularProgress,
} from '@mui/material';
import { isValidId } from '@/utils/routeValidation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  ArrowBack,
  PlayArrow,
  Download,
  Add,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import {
  useContract,
  useActivateContract,
  useGetContractPdf,
  useContractAmendments,
  useCreateAmendment,
  useApproveAmendment,
  useVersionHistory,
  useContractVersion,
  useCompareVersions,
} from '@/hooks/useContracts';
import { usePaymentsByContract } from '@/hooks/usePayments';
import { useShipmentsByContract } from '@/hooks/useShipments';
import { PaymentListItem } from '@/components/Payment/PaymentListItem';
import { ShipmentListItem } from '@/components/Shipment/ShipmentListItem';
import { ContractStatusBadge } from '@/components/Contract/ContractStatusBadge';
import { EnhancedStatusBadge } from '@/components/Workflow/EnhancedStatusBadge';
import { PartiesOverview } from '@/components/Contract/PartiesOverview';
import { SignatureFlow } from '@/components/Contract/SignatureFlow';
import { ContractStatusTimeline } from '@/components/Contract/ContractStatusTimeline';
import { ActivityHistory } from '@/components/Audit/ActivityHistory';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { calculateVAT } from '@/utils/vat';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ContractStatus, CreateAmendmentDto } from '@/types/contract';
import { PaymentStatus } from '@/types/payment';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Tabs, Tab } from '@mui/material';
import { WorkflowNextSteps, WorkflowIcons } from '@/components/Workflow/WorkflowNextSteps';
import { WorkflowLinks } from '@/components/Workflow/WorkflowLinks';
import { ActiveContractNextSteps } from '@/components/Contract/ActiveContractNextSteps';
import { WorkflowStatusIndicator, WorkflowStep } from '@/components/Workflow/WorkflowStatusIndicator';
import { WorkflowNextStepsEnhanced } from '@/components/Workflow/WorkflowNextStepsEnhanced';
import { VersionHistoryList } from '@/components/Contract/VersionHistoryList';
import { VersionViewer } from '@/components/Contract/VersionViewer';
import { VersionDiff } from '@/components/Contract/VersionDiff';
import { ResponsiveTable } from '@/components/common';

const amendmentSchema = yup.object({
  reason: yup.string().required('Reason is required').min(5, 'Reason must be at least 5 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
});

export const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [amendmentDialogOpen, setAmendmentDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedAmendment, setSelectedAmendment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [comparingVersions, setComparingVersions] = useState<{ v1: number; v2: number } | null>(null);

  // All hooks must be called before any conditional returns
  const activateMutation = useActivateContract();
  const pdfMutation = useGetContractPdf();
  const createAmendmentMutation = useCreateAmendment();
  const approveAmendmentMutation = useApproveAmendment();

  // Validate ID - reject invalid values like "create", "new", etc.
  const validId = isValidId(id) ? id : undefined;

  // Only call these hooks if id is valid
  const { data, isLoading, error } = useContract(validId);
  const { data: amendmentsData } = useContractAmendments(validId);
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentsByContract(validId);
  const { data: shipmentsData, isLoading: shipmentsLoading } = useShipmentsByContract(validId);
  const { data: versionsData } = useVersionHistory(validId);
  const { data: versionData } = useContractVersion(validId, viewingVersion);
  const { data: diffData } = useCompareVersions(
    validId,
    comparingVersions?.v1,
    comparingVersions?.v2
  );

  const {
    control: amendmentControl,
    handleSubmit: handleAmendmentSubmit,
    reset: resetAmendment,
    formState: { errors: amendmentErrors },
  } = useForm<CreateAmendmentDto>({
    resolver: yupResolver(amendmentSchema) as any,
    defaultValues: {
      reason: '',
      description: '',
      changes: {},
    },
  });

  // Redirect if ID is missing or invalid
  useEffect(() => {
    if (!isValidId(id)) {
      navigate('/contracts', { replace: true });
    }
  }, [id, navigate]);

  // Early returns after all hooks
  if (!isValidId(id)) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid contract ID. Redirecting...
      </Alert>
    );
  }

  const contract = data?.data;
  const amendments = amendmentsData?.data || [];
  const payments = paymentsData?.data || [];
  const shipments = shipmentsData?.data || [];

  // Show loading state
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Show error state
  if (error || !contract) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error ? 'Failed to load contract details' : 'Contract not found'}
      </Alert>
    );
  }

  // Validate contract has required fields
  if (!contract._id && !contract.id) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid contract data
      </Alert>
    );
  }

  const isBuyer = role === Role.BUYER; // Only Buyer can activate contracts
  const canActivate =
    isBuyer &&
    contract.status === ContractStatus.SIGNED &&
    contract.signatures?.length === contract.parties?.length;

  const handleActivate = () => {
    if (window.confirm('Are you sure you want to activate this contract?')) {
      if (validId) {
        activateMutation.mutate(validId, {
          onSuccess: () => {
            // Contract will be refetched automatically
          },
        });
      }
    }
  };

  const handleDownloadPdf = () => {
    if (validId) {
      pdfMutation.mutate(validId);
    }
  };

  const handleCreateAmendment = () => {
    resetAmendment();
    setAmendmentDialogOpen(true);
  };

  const onSubmitAmendment = (data: CreateAmendmentDto) => {
    if (validId) {
      createAmendmentMutation.mutate(
        { contractId: validId, data },
        {
          onSuccess: () => {
            setAmendmentDialogOpen(false);
            resetAmendment();
          },
        }
      );
    }
  };

  const handleApproveAmendment = (amendment: any, approved: boolean) => {
    if (validId) {
      setSelectedAmendment(amendment);
      approveAmendmentMutation.mutate(
        {
          contractId: validId,
          amendmentId: amendment.id,
          data: { approved, comments: '' },
        },
        {
          onSuccess: () => {
            setApproveDialogOpen(false);
            setSelectedAmendment(null);
          },
        }
      );
    }
  };

  const handleWorkflowAction = (action: string) => {
    if (action === 'activate' && validId && canActivate) {
      handleActivate();
    } else if (action === 'sign' && validId) {
      // Navigate to signature flow or trigger signature modal
      // This would depend on your signature implementation
    } else if (action === 'review' && validId) {
      // Navigate to review page or open review modal
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/contracts')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Contract #{(contract._id || contract.id || '').toString().slice(-6)}
            </Typography>
            <EnhancedStatusBadge entityType="contract" status={contract.status} showContext />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Created {formatDateTime(contract.createdAt)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadPdf}
            disabled={pdfMutation.isPending}
          >
            {pdfMutation.isPending ? 'Downloading...' : 'Download PDF'}
          </Button>
          {canActivate && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={handleActivate}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? 'Activating...' : 'Activate Contract'}
            </Button>
          )}
        </Stack>
      </Box>

      {/* What's Next Component - Enhanced */}
      <WorkflowNextStepsEnhanced
        entityType="contract"
        status={contract.status}
        entityId={validId}
        relatedEntities={[
          ...(payments.length > 0
            ? payments.slice(0, 3).map((payment: any) => ({
                id: payment._id || payment.id || '',
                type: 'payment' as const,
                label: `Payment: ${payment.milestone || 'Milestone'}`,
                status: payment.status,
                metadata: {
                  amount: payment.amount,
                  currency: payment.currency,
                },
              }))
            : []),
          ...(shipments.length > 0
            ? shipments.slice(0, 2).map((shipment: any) => ({
                id: shipment._id || shipment.id || '',
                type: 'shipment' as const,
                label: `Shipment #${(shipment._id || shipment.id || '').toString().slice(-6)}`,
                status: shipment.status,
              }))
            : []),
        ]}
        onAction={handleWorkflowAction}
        notifications={[
          ...(contract.status === ContractStatus.SIGNED
            ? [
                {
                  type: 'success' as const,
                  message: 'Contract has been signed by all parties. Ready for activation.',
                  timestamp: contract.updatedAt,
                },
              ]
            : []),
          ...(contract.status === ContractStatus.ACTIVE && payments.length === 0
            ? [
                {
                  type: 'info' as const,
                  message: 'Payments will be created automatically from the payment schedule.',
                },
              ]
            : []),
          ...(contract.status === ContractStatus.ACTIVE && payments.length > 0
            ? [
                {
                  type: 'success' as const,
                  message: `${payments.length} payment${payments.length !== 1 ? 's' : ''} created from payment schedule.`,
                },
              ]
            : []),
        ]}
      />


      {/* Legacy Workflow Next Steps - Keep for backward compatibility */}
      {contract.status === ContractStatus.PENDING_SIGNATURES && (
        <WorkflowNextSteps
          title="Next Steps: Sign Contract"
          steps={[
            {
              id: 'sign-contract',
              title: 'Sign the Contract',
              description: `${contract.signatures?.length || 0} of ${contract.parties?.length || 0} parties have signed. All parties must sign before the contract can be activated.`,
              action: {
                label: 'View Signature Section',
                path: `#signature`,
                variant: 'outlined',
              },
              icon: WorkflowIcons.Contract,
              required: true,
            },
          ]}
        />
      )}

      {contract.status === ContractStatus.SIGNED && canActivate && (
        <WorkflowNextSteps
          title="Next Steps: Activate Contract"
          steps={[
            {
              id: 'activate-contract',
              title: 'Activate Contract',
              description: 'All parties have signed. Activate the contract to begin execution. Payments will be created automatically from the payment schedule.',
              action: {
                label: 'Activate Now',
                path: `#activate`,
                variant: 'contained',
              },
              icon: WorkflowIcons.Payment,
              required: true,
            },
          ]}
        />
      )}

      {contract.status === ContractStatus.ACTIVE && <ActiveContractNextSteps contractId={contract.id || contract._id || ''} />}

      {contract.status === ContractStatus.SIGNED && !canActivate && (
        <WorkflowNextSteps
          title="Contract Fully Signed"
          steps={[
            {
              id: 'wait-activation',
              title: 'Waiting for Buyer Activation',
              description: 'All parties have signed. The buyer will activate the contract to begin execution.',
              action: {
                label: 'View Contract',
                path: `/contracts/${contract._id || contract.id}`,
                variant: 'outlined',
              },
              required: false,
            },
          ]}
        />
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Contract Terms */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Contract Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {contract.terms || 'No terms specified'}
              </Typography>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          {contract.paymentSchedule && contract.paymentSchedule.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Payment Schedule
                </Typography>
                <ResponsiveTable
                  columns={[
                    {
                      id: 'milestone',
                      label: 'Milestone',
                      priority: 'high',
                      render: (milestone: any) => (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {milestone.milestone}
                        </Typography>
                      ),
                      mobileLabel: 'Milestone',
                    },
                    {
                      id: 'amount',
                      label: 'Amount',
                      priority: 'high',
                      render: (milestone: any) => (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(milestone.amount, contract.amounts.currency)}
                          </Typography>
                          {milestone.amount > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              {(() => {
                                const vatBreakdown = calculateVAT(milestone.amount, 0.05, contract.amounts.currency);
                                return (
                                  <Typography variant="caption" color="text.secondary">
                                    {formatCurrency(vatBreakdown.subtotal, contract.amounts.currency)} + {formatCurrency(vatBreakdown.vatAmount, contract.amounts.currency)} VAT
                                  </Typography>
                                );
                              })()}
                            </Box>
                          )}
                        </Box>
                      ),
                      align: 'right',
                      mobileLabel: 'Amount',
                    },
                    {
                      id: 'dueDate',
                      label: 'Due Date',
                      priority: 'medium',
                      render: (milestone: any) => (
                        <Typography variant="body2">{formatDate(milestone.dueDate)}</Typography>
                      ),
                      mobileLabel: 'Due Date',
                    },
                    {
                      id: 'status',
                      label: 'Status',
                      priority: 'high',
                      render: (milestone: any) => (
                        <Chip
                          label={milestone.status}
                          size="small"
                          color={
                            milestone.status === 'paid'
                              ? 'success'
                              : milestone.status === 'pending'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      ),
                      mobileLabel: 'Status',
                    },
                  ]}
                  data={contract.paymentSchedule}
                  keyExtractor={(milestone, index) => `milestone-${index}`}
                  emptyMessage="No payment milestones"
                />
              </CardContent>
            </Card>
          )}

          {/* Workflow Status Indicator - Show what happens after contract signing/activation */}
          {(contract.status === ContractStatus.SIGNED || contract.status === ContractStatus.ACTIVE) && (
            <WorkflowStatusIndicator
              title="Workflow Status: After Contract Signing"
              steps={[
                {
                  id: 'contract-signed',
                  label: 'Contract Signed',
                  status: 'completed',
                  description: 'All parties have signed the contract',
                  timestamp: contract.updatedAt,
                },
                {
                  id: 'contract-activated',
                  label: 'Contract Activated',
                  status:
                    contract.status === ContractStatus.ACTIVE
                      ? 'completed'
                      : contract.status === ContractStatus.SIGNED
                      ? 'pending'
                      : 'not_started',
                  description:
                    contract.status === ContractStatus.ACTIVE
                      ? 'Contract is active and ready for execution'
                      : 'Waiting for buyer to activate the contract',
                  timestamp: contract.status === ContractStatus.ACTIVE ? contract.updatedAt : undefined,
                },
                {
                  id: 'payments-created',
                  label: 'Payments Created',
                  status:
                    payments.length > 0
                      ? 'completed'
                      : contract.status === ContractStatus.ACTIVE
                      ? 'pending'
                      : 'not_started',
                  description:
                    payments.length > 0
                      ? `${payments.length} payment${payments.length !== 1 ? 's' : ''} created from payment schedule`
                      : contract.status === ContractStatus.ACTIVE
                      ? 'Payments will be created automatically from the payment schedule'
                      : 'Payments will be created once contract is activated',
                  metadata:
                    payments.length > 0
                      ? {
                          count: payments.length,
                          status: payments.every((p: any) => p.status === PaymentStatus.COMPLETED)
                            ? 'completed'
                            : payments.some((p: any) => p.status === PaymentStatus.COMPLETED)
                            ? 'partial'
                            : 'pending',
                        }
                      : undefined,
                },
                {
                  id: 'shipments-created',
                  label: 'Shipments Created',
                  status: shipments.length > 0 ? 'completed' : contract.status === ContractStatus.ACTIVE ? 'pending' : 'not_started',
                  description:
                    shipments.length > 0
                      ? `${shipments.length} shipment${shipments.length !== 1 ? 's' : ''} created for this contract`
                      : contract.status === ContractStatus.ACTIVE
                      ? 'Shipments can be created once goods are ready for delivery'
                      : 'Shipments can be created once contract is active',
                  metadata:
                    shipments.length > 0
                      ? {
                          count: shipments.length,
                          status: shipments.every((s: any) => s.status === 'delivered')
                            ? 'completed'
                            : shipments.some((s: any) => s.status === 'delivered')
                            ? 'partial'
                            : 'in_progress',
                        }
                      : undefined,
                },
              ]}
            />
          )}

          {/* Legacy Workflow Status - Contract → Payment → Shipment */}
          <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Workflow Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Contract Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Contract
                    </Typography>
                    <ContractStatusBadge status={contract.status} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {contract.status === ContractStatus.ACTIVE
                        ? 'Contract is active and ready for payments'
                        : contract.status === ContractStatus.SIGNED
                        ? 'Contract signed, awaiting activation'
                        : contract.status === ContractStatus.PENDING_SIGNATURES
                        ? 'Awaiting signatures from all parties'
                        : 'Contract is not yet active'}
                    </Typography>
                  </Box>
                </Box>

                {/* Payment Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Payments
                    </Typography>
                    {paymentsLoading ? (
                      <CircularProgress size={16} />
                    ) : payments.length > 0 ? (
                      <Chip label={`${payments.length} created`} size="small" color="success" />
                    ) : contract.status === ContractStatus.ACTIVE ? (
                      <Chip label="Pending creation" size="small" color="warning" />
                    ) : (
                      <Chip label="Not created" size="small" color="default" />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {payments.length > 0
                        ? `${payments.length} payment${payments.length !== 1 ? 's' : ''} created from payment schedule`
                        : contract.status === ContractStatus.ACTIVE
                        ? 'Payments will be created automatically from the payment schedule'
                        : 'Payments will be created once contract is active'}
                    </Typography>
                    {payments.length > 0 && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => validId && navigate(`/payments?contractId=${validId}`)}
                        sx={{ mt: 0.5 }}
                      >
                        View all payments →
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Shipment Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Shipments
                    </Typography>
                    {shipmentsLoading ? (
                      <CircularProgress size={16} />
                    ) : shipments.length > 0 ? (
                      <Chip label={`${shipments.length} created`} size="small" color="success" />
                    ) : contract.status === ContractStatus.ACTIVE ? (
                      <Chip label="Can be created" size="small" color="info" />
                    ) : (
                      <Chip label="Not created" size="small" color="default" />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {shipments.length > 0
                        ? `${shipments.length} shipment${shipments.length !== 1 ? 's' : ''} created for this contract`
                        : contract.status === ContractStatus.ACTIVE
                        ? 'Shipments can be created once goods are ready for delivery'
                        : 'Shipments can be created once contract is active'}
                    </Typography>
                    {shipments.length > 0 && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => validId && navigate(`/shipments?contractId=${validId}`)}
                        sx={{ mt: 0.5 }}
                      >
                        View all shipments →
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* What's Next Guidance */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    What's Next?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {contract.status === ContractStatus.PENDING_SIGNATURES
                      ? '→ Wait for all parties to sign the contract'
                      : contract.status === ContractStatus.SIGNED
                      ? '→ Activate the contract to enable payments and shipments'
                      : contract.status === ContractStatus.ACTIVE && payments.length === 0
                      ? '→ Payments will be created automatically. Review the payment schedule above.'
                      : contract.status === ContractStatus.ACTIVE && payments.length > 0 && shipments.length === 0
                      ? '→ Create shipments when goods are ready for delivery'
                      : contract.status === ContractStatus.ACTIVE
                      ? '→ Monitor payments and shipments progress'
                      : '→ Complete contract signing to proceed'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <ContractStatusTimeline
                status={contract.status}
                createdAt={contract.createdAt}
                updatedAt={contract.updatedAt}
                signaturesCount={contract.signatures?.length || 0}
                totalParties={contract.parties?.length || 0}
              />
            </CardContent>
          </Card>

          {/* Payments */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Payments
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/payments?contractId=${id}`)}
                >
                  View All
                </Button>
              </Box>
              {paymentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : payments.length === 0 ? (
                <Alert severity="info">
                  No payments found for this contract. Payments will be created automatically when the contract is activated.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {payments.slice(0, 5).map((payment: any) => (
                    <PaymentListItem key={payment._id || payment.id} payment={payment} />
                  ))}
                  {payments.length > 5 && (
                    <Button
                      variant="text"
                      fullWidth
                      onClick={() => navigate(`/payments?contractId=${id}`)}
                    >
                      View all {payments.length} payments
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Shipments */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Shipments
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/shipments?contractId=${id}`)}
                >
                  View All
                </Button>
              </Box>
              {shipmentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : shipments.length === 0 ? (
                <Alert severity="info">
                  No shipments found for this contract. Shipments can be created once the contract is active.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {shipments.slice(0, 5).map((shipment: any) => (
                    <ShipmentListItem key={shipment.id || shipment._id} shipment={shipment} />
                  ))}
                  {shipments.length > 5 && (
                    <Button
                      variant="text"
                      fullWidth
                      onClick={() => navigate(`/shipments?contractId=${id}`)}
                    >
                      View all {shipments.length} shipments
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Amendments */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Amendments
                </Typography>
                {contract.status === ContractStatus.ACTIVE && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleCreateAmendment}
                  >
                    Create Amendment
                  </Button>
                )}
              </Box>
              {amendments.length === 0 ? (
                <Alert severity="info">No amendments found for this contract.</Alert>
              ) : (
                <Box>
                  {amendments.map((amendment: any) => (
                    <Accordion key={amendment.id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Amendment #{amendment.amendmentNumber}
                          </Typography>
                          <Chip
                            label={amendment.status}
                            size="small"
                            color={
                              amendment.status === 'approved'
                                ? 'success'
                                : amendment.status === 'pending'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Reason
                          </Typography>
                          <Typography variant="body1">{amendment.reason}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Description
                          </Typography>
                          <Typography variant="body1">{amendment.description}</Typography>
                        </Box>
                        {amendment.status === 'pending' && (
                          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApproveAmendment(amendment, true)}
                              disabled={approveAmendmentMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Cancel />}
                              onClick={() => handleApproveAmendment(amendment, false)}
                              disabled={approveAmendmentMutation.isPending}
                            >
                              Reject
                            </Button>
                          </Stack>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Parties Overview */}
          <PartiesOverview contract={contract} />

          {/* Signature Flow */}
          <Box sx={{ mt: 3 }}>
            <SignatureFlow contract={contract} />
          </Box>

          {/* Contract Details */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Contract Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(contract.amounts.total, contract.amounts.currency)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Start Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(contract.startDate)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    End Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(contract.endDate)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {Math.ceil(
                      (new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </Typography>
                </Box>
                {contract.amounts?.breakdown && contract.amounts.breakdown.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Amount Breakdown
                      </Typography>
                      {contract.amounts.breakdown.map((breakdown, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {breakdown.description}: {formatCurrency(breakdown.amount, contract.amounts.currency)}
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

      {/* Create Amendment Dialog */}
      <Dialog open={amendmentDialogOpen} onClose={() => setAmendmentDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleAmendmentSubmit(onSubmitAmendment)}>
          <DialogTitle>Create Contract Amendment</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Controller
                name="reason"
                control={amendmentControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Reason for Amendment"
                    placeholder="e.g., Change in delivery schedule"
                    error={!!amendmentErrors.reason}
                    helperText={amendmentErrors.reason?.message}
                    required
                    sx={{ mb: 2 }}
                  />
                )}
              />
              <Controller
                name="description"
                control={amendmentControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    placeholder="Provide a detailed description of the changes..."
                    error={!!amendmentErrors.description}
                    helperText={amendmentErrors.description?.message}
                    required
                  />
                )}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                Note: Amendment changes can be specified after creation. This creates a pending amendment that requires approval from all parties.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAmendmentDialogOpen(false)} disabled={createAmendmentMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createAmendmentMutation.isPending}>
              {createAmendmentMutation.isPending ? <CircularProgress size={20} /> : 'Create Amendment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Payment Schedule Alert - Show after signing */}
      {contract.status === ContractStatus.SIGNED && contract.paymentSchedule && contract.paymentSchedule.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Contract Signed - Payment Schedule Activated
          </Typography>
          <Typography variant="body2">
            Payment schedule is now active. Review the payment milestones below and set up payment reminders.
          </Typography>
        </Alert>
      )}

      {/* Tabs: Details, Version History, Activity History */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Version History" />
          <Tab label="Activity History" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Details content is already shown above */}
            </Box>
          )}
          {activeTab === 1 && validId && versionsData?.data && (
            <VersionHistoryList
              versions={versionsData.data}
              currentVersion={contract?.version || contract?.versionNumber || 1}
              onViewVersion={(version) => setViewingVersion(version)}
              onCompareVersions={(v1, v2) => setComparingVersions({ v1, v2 })}
            />
          )}
          {activeTab === 2 && validId && (
            <ActivityHistory
              resource="contract"
              resourceId={validId}
              title="Contract Activity History"
              showExport={true}
            />
          )}
        </Box>
      </Box>

      {/* Version Viewer Dialog */}
      {viewingVersion && versionData?.data && (
        <VersionViewer
          version={versionData.data}
          open={!!viewingVersion}
          onClose={() => setViewingVersion(null)}
        />
      )}

      {/* Version Diff Dialog */}
      {comparingVersions && diffData?.data && (
        <VersionDiff
          diff={diffData.data}
          open={!!comparingVersions}
          onClose={() => setComparingVersions(null)}
        />
      )}
    </Box>
  );
};
