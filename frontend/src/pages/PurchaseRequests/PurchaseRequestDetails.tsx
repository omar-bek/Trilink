import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  Send,
  Delete,
  ArrowBack,
  LocationOn,
  CalendarToday,
  AttachMoney,
} from '@mui/icons-material';
import { FormControlLabel, Checkbox } from '@mui/material';
import { usePurchaseRequest, useSubmitPurchaseRequest, useDeletePurchaseRequest, useApprovePurchaseRequest } from '@/hooks/usePurchaseRequests';
import { PurchaseRequestStatus } from '@/types/purchase-request';
import { StatusBadge } from '@/components/PurchaseRequest/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { calculateVAT } from '@/utils/vat';
import { ActivityHistory } from '@/components/Audit/ActivityHistory';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { useQuery } from '@tanstack/react-query';
import { rfqService } from '@/services/rfq.service';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { CheckCircle, Assignment } from '@mui/icons-material';
import { Tabs, Tab } from '@mui/material';
import { WorkflowNextSteps, WorkflowIcons } from '@/components/Workflow/WorkflowNextSteps';
import { WorkflowLinks } from '@/components/Workflow/WorkflowLinks';
import { useCategory } from '@/hooks/useCategories';
import { Label as LabelIcon } from '@mui/icons-material';

export const PurchaseRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [includeSupplier, setIncludeSupplier] = useState(true);
  const [includeLogistics, setIncludeLogistics] = useState(true);
  const [includeClearance, setIncludeClearance] = useState(true);
  const [includeServiceProvider, setIncludeServiceProvider] = useState(true);

  // Redirect if ID is missing or invalid
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      navigate('/purchase-requests', { replace: true });
    }
  }, [id, navigate]);

  if (!id || id === 'undefined' || id === 'null') {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid purchase request ID. Redirecting...
      </Alert>
    );
  }

  const { data, isLoading, error } = usePurchaseRequest(id);
  const submitMutation = useSubmitPurchaseRequest();
  const deleteMutation = useDeletePurchaseRequest();
  const approveMutation = useApprovePurchaseRequest();

  const purchaseRequest = data?.data;

  // Use category names from API if available, otherwise fetch
  const categoryName = purchaseRequest?.categoryName;
  const subCategoryName = purchaseRequest?.subCategoryName;
  
  // Fetch category information only if names are not provided
  const { data: categoryData, isLoading: isLoadingCategory } = useCategory(
    (!categoryName && purchaseRequest?.categoryId) ? purchaseRequest.categoryId : undefined
  );
  const { data: subCategoryData, isLoading: isLoadingSubCategory } = useCategory(
    (!subCategoryName && purchaseRequest?.subCategoryId) ? purchaseRequest.subCategoryId : undefined
  );
  const category = categoryData?.data;
  const subCategory = subCategoryData?.data;

  // Fetch RFQs generated from this PR
  const { data: rfqsData } = useQuery({
    queryKey: ['rfqs-by-pr', id],
    queryFn: () => rfqService.getRFQsByPurchaseRequest(id!),
    enabled: !!id && !!purchaseRequest?.rfqGenerated,
  });

  const generatedRFQs = rfqsData?.data || [];

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !purchaseRequest) {
    return (
      <Alert severity="error">
        Failed to load purchase request. Please try again.
      </Alert>
    );
  }

  const canEdit = purchaseRequest.status === PurchaseRequestStatus.DRAFT;
  const canSubmit = purchaseRequest.status === PurchaseRequestStatus.DRAFT;
  const canApprove =
    (user?.role === Role.GOVERNMENT ||
      user?.role === Role.ADMIN ||
      user?.role === Role.COMPANY_MANAGER) &&
    purchaseRequest.status === PurchaseRequestStatus.PENDING_APPROVAL;

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit this purchase request? It cannot be edited after submission.')) {
      submitMutation.mutate(id!, {
        onSuccess: () => {
          navigate('/purchase-requests');
        },
      });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(id!, {
      onSuccess: () => {
        navigate('/purchase-requests');
      },
    });
    setDeleteDialogOpen(false);
  };

  const handleApprove = () => {
    // Build RFQ types array based on checkboxes - all are optional now
    const rfqTypes: string[] = [];
    if (includeSupplier) {
      rfqTypes.push('Supplier');
    }
    if (includeLogistics) {
      rfqTypes.push('Logistics');
    }
    if (includeClearance) {
      rfqTypes.push('Clearance');
    }
    if (includeServiceProvider) {
      rfqTypes.push('Service Provider');
    }

    // Validate that at least one RFQ type is selected
    if (rfqTypes.length === 0) {
      alert('Please select at least one RFQ type to generate.');
      return;
    }

    approveMutation.mutate(
      {
        id: id!,
        data: {
          rfqTypes: rfqTypes.length < 4 ? rfqTypes : undefined, // Only send if not all types
        }
      },
      {
        onSuccess: () => {
          setApproveDialogOpen(false);
        },
      }
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/purchase-requests')}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {purchaseRequest.title}
            </Typography>
            <StatusBadge status={purchaseRequest.status} rfqGenerated={purchaseRequest.rfqGenerated} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Created {formatDateTime(purchaseRequest.createdAt)}
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/purchase-requests/${id}/edit`)}
          >
            Edit
          </Button>
        )}
        {canSubmit && (
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            Submit
          </Button>
        )}
        {canEdit && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        )}
        {canApprove && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => setApproveDialogOpen(true)}
            disabled={approveMutation.isPending}
          >
            Approve
          </Button>
        )}
      </Box>

      {/* Workflow Next Steps */}
      {purchaseRequest.status === PurchaseRequestStatus.APPROVED && !purchaseRequest.rfqGenerated && (
        <WorkflowNextSteps
          title="Next Steps: Generate RFQs"
          steps={[
            {
              id: 'generate-rfqs',
              title: 'RFQs will be auto-generated',
              description: 'RFQs for Supplier, Logistics, Clearance, and Service Provider will be created automatically.',
              action: {
                label: 'Refresh to View RFQs',
                path: `/purchase-requests/${id}`,
                variant: 'outlined',
              },
              icon: WorkflowIcons.RFQ,
              required: true,
            },
          ]}
        />
      )}

      {purchaseRequest.rfqGenerated && generatedRFQs.length > 0 && (
        <>
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            icon={<Assignment />}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              RFQs Generated Successfully
            </Typography>
            <Typography variant="body2">
              {generatedRFQs.length} RFQ{generatedRFQs.length > 1 ? 's have' : ' has'} been automatically generated from this purchase request.
            </Typography>
          </Alert>
          <WorkflowNextSteps
            title="Next Steps: Review RFQs"
            steps={[
              {
                id: 'review-rfqs',
                title: 'Review Generated RFQs',
                description: `Review the ${generatedRFQs.length} RFQ${generatedRFQs.length > 1 ? 's' : ''} and wait for providers to submit bids.`,
                action: {
                  label: 'View All RFQs',
                  path: `/rfqs?purchaseRequestId=${id}`,
                },
                icon: WorkflowIcons.RFQ,
                required: true,
              },
            ]}
          />
          <WorkflowLinks
            title="Generated RFQs"
            links={generatedRFQs.map((rfq) => ({
              type: 'rfq',
              id: rfq._id || rfq.id || '',
              label: `${rfq.type} RFQ`,
              status: rfq.status,
            }))}
          />
        </>
      )}

      {purchaseRequest.status === PurchaseRequestStatus.PENDING_APPROVAL && (
        <WorkflowNextSteps
          title="Awaiting Approval"
          steps={[
            {
              id: 'wait-approval',
              title: 'Waiting for Company Manager/Government/Admin Approval',
              description: 'This purchase request is pending approval. Once approved, RFQs will be automatically generated.',
              action: {
                label: 'View Status',
                onClick: () => setActiveTab(1),
                variant: 'outlined',
              },
              required: true,
            },
          ]}
        />
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Category Information */}
          {(category || subCategory || purchaseRequest.categoryId || isLoadingCategory || isLoadingSubCategory) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Category
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {categoryName ? (
                    <Chip
                      label={categoryName}
                      color="primary"
                      variant="outlined"
                      icon={<LabelIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                  ) : isLoadingCategory ? (
                    <Chip label="Loading category..." size="small" variant="outlined" />
                  ) : category ? (
                    <Chip
                      label={category.name || 'Unknown Category'}
                      color="primary"
                      variant="outlined"
                      icon={<LabelIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                  ) : purchaseRequest.categoryId ? (
                    <Chip
                      label={`Category ID: ${purchaseRequest.categoryId.substring(0, 8)}...`}
                      color="default"
                      variant="outlined"
                      size="small"
                    />
                  ) : null}
                  {subCategoryName ? (
                    <Chip
                      label={subCategoryName}
                      color="secondary"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  ) : isLoadingSubCategory ? (
                    <Chip label="Loading sub-category..." size="small" variant="outlined" />
                  ) : subCategory ? (
                    <Chip
                      label={subCategory.name || 'Unknown Sub-Category'}
                      color="secondary"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  ) : purchaseRequest.subCategoryId ? (
                    <Chip
                      label={`Sub-Category ID: ${purchaseRequest.subCategoryId.substring(0, 8)}...`}
                      color="default"
                      variant="outlined"
                      size="small"
                    />
                  ) : null}
                </Box>
                {category?.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {category.description}
                  </Typography>
                )}
                {!category && purchaseRequest.categoryId && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Category information is being loaded...
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {purchaseRequest.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Items */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Items ({purchaseRequest.items.length})
              </Typography>
              {purchaseRequest.items.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    {item.estimatedPrice && (
                      <Chip
                        label={formatCurrency(item.estimatedPrice, purchaseRequest.currency)}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Quantity: {item.quantity} {item.unit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Specifications: {item.specifications}
                  </Typography>
                  {index < purchaseRequest.items.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AttachMoney fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Budget
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(purchaseRequest.budget, purchaseRequest.currency)}
                  </Typography>
                  {purchaseRequest.budget > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {(() => {
                        const vatBreakdown = calculateVAT(purchaseRequest.budget, 0.05, purchaseRequest.currency);
                        return (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Subtotal: {formatCurrency(vatBreakdown.subtotal, purchaseRequest.currency)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              VAT (5%): {formatCurrency(vatBreakdown.vatAmount, purchaseRequest.currency)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                              Total (incl. VAT): {formatCurrency(vatBreakdown.total, purchaseRequest.currency)}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Required Delivery Date
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(purchaseRequest.requiredDeliveryDate)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Delivery Location
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {purchaseRequest.deliveryLocation.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {purchaseRequest.deliveryLocation.city}, {purchaseRequest.deliveryLocation.state}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {purchaseRequest.deliveryLocation.country} {purchaseRequest.deliveryLocation.zipCode}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              resource="purchase_request"
              resourceId={id}
              title="Purchase Request Activity History"
              showExport={true}
            />
          )}
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Purchase Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this purchase request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Purchase Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to approve this purchase request?
          </DialogContentText>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              What happens next:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <li>RFQs will be automatically generated for the selected provider types</li>
              <li>You'll be able to view and manage the generated RFQs</li>
              <li>Providers will be notified and can submit bids</li>
            </Box>
          </Alert>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Select RFQ Types to Generate:
            </Typography>
            <Box sx={{ pl: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={includeSupplier} onChange={(e) => setIncludeSupplier(e.target.checked)} />}
                label="Supplier (Optional)"
              />
              <FormControlLabel
                control={<Checkbox checked={includeLogistics} onChange={(e) => setIncludeLogistics(e.target.checked)} />}
                label="Logistics (Optional)"
              />
              <FormControlLabel
                control={<Checkbox checked={includeClearance} onChange={(e) => setIncludeClearance(e.target.checked)} />}
                label="Clearance (Optional)"
              />
              <FormControlLabel
                control={<Checkbox checked={includeServiceProvider} onChange={(e) => setIncludeServiceProvider(e.target.checked)} />}
                label="Service Provider (Optional)"
              />
            </Box>
          </Box>
          {approveMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {approveMutation.error?.response?.data?.message || 'Failed to approve purchase request'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApprove}
            color="success"
            variant="contained"
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve & Generate RFQs'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
