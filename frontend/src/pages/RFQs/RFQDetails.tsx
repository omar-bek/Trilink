import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
} from '@mui/material';
import { isValidId } from '@/utils/routeValidation';
import {
  ArrowBack,
  LocationOn,
  CalendarToday,
  AttachMoney,
  AccessTime,
  Edit,
  Delete,
  Description,
  LocalShipping,
  Assignment,
  AttachFile,
  CheckCircle,
} from '@mui/icons-material';
import { useRFQ, useUpdateRFQ, useDeleteRFQ, useRevealRFQIdentity } from '@/hooks/useRFQs';
import { useBidsByRFQ } from '@/hooks/useBids';
import { RFQStatusBadge } from '@/components/RFQ/RFQStatusBadge';
import { EnhancedStatusBadge } from '@/components/Workflow/EnhancedStatusBadge';
import { WorkflowNextStepsEnhanced } from '@/components/Workflow/WorkflowNextStepsEnhanced';
import { DeadlineCountdown } from '@/components/RFQ/DeadlineCountdown';
import { AnonymousBadge } from '@/components/Anonymity/AnonymousBadge';
import { IdentityRevealModal } from '@/components/Anonymity/IdentityRevealModal';
import { ActivityHistory } from '@/components/Audit/ActivityHistory';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { calculateVAT } from '@/utils/vat';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { RFQStatus } from '@/types/rfq';
import { Tabs, Tab, Box as MuiBox } from '@mui/material';
import { useState } from 'react';
import { useCategory } from '@/hooks/useCategories';
import { Label as LabelIcon } from '@mui/icons-material';

export const RFQDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [activeTab, setActiveTab] = useState(0);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const revealMutation = useRevealRFQIdentity();

  // Validate ID - reject invalid values like "create", "new", etc.
  const validId = isValidId(id) ? id : undefined;

  // Redirect if ID is missing or invalid
  useEffect(() => {
    if (!isValidId(id)) {
      navigate('/rfqs', { replace: true });
    }
  }, [id, navigate]);

  if (!isValidId(id)) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid RFQ ID. Redirecting...
      </Alert>
    );
  }

  const { data, isLoading, error } = useRFQ(validId);
  const rfq = data?.data;
  const updateMutation = useUpdateRFQ();
  const deleteMutation = useDeleteRFQ();

  // Fetch category information
  const categoryName = rfq?.categoryName;
  const subCategoryName = rfq?.subCategoryName;
  const { data: categoryData, isLoading: isLoadingCategory } = useCategory(
    (!categoryName && rfq?.categoryId) ? rfq.categoryId : undefined
  );
  const { data: subCategoryData, isLoading: isLoadingSubCategory } = useCategory(
    (!subCategoryName && rfq?.subCategoryId) ? rfq.subCategoryId : undefined
  );
  const category = categoryData?.data;
  const subCategory = subCategoryData?.data;

  // Fetch bids for this RFQ to show workflow visibility
  const { data: bidsData } = useBidsByRFQ(validId, {});
  const bids = bidsData?.data || [];
  const acceptedBids = bids.filter((bid: any) => bid.status === 'accepted');
  const submittedBids = bids.filter((bid: any) => bid.status === 'submitted' || bid.status === 'under_review');

  const isBuyer = role === Role.BUYER || role === Role.ADMIN || role === Role.GOVERNMENT;
  const canRevealIdentity = rfq?.anonymousBuyer && (isBuyer || role === Role.ADMIN || role === Role.GOVERNMENT);
  
  // Check if this RFQ belongs to the current user's company
  const isOwnCompanyRFQ = rfq && user?.companyId && rfq.companyId && user.companyId === rfq.companyId;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this RFQ? This action cannot be undone.')) {
      if (id) {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            navigate('/rfqs');
          },
        });
      }
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this RFQ?')) {
      if (id) {
        updateMutation.mutate(
          { id, data: { status: RFQStatus.CANCELLED } },
          {
            onSuccess: () => {
              // Query will be invalidated automatically
            },
          }
        );
      }
    }
  };

  const handleWorkflowAction = (action: string) => {
    if (action === 'publish' && validId) {
      updateMutation.mutate(
        { id: validId, data: { status: RFQStatus.OPEN } },
        {
          onSuccess: () => {
            // Query will be invalidated automatically
          },
        }
      );
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !rfq) {
    return (
      <Alert severity="error">
        Failed to load RFQ. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rfqs')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {rfq.title}
            </Typography>
            <EnhancedStatusBadge entityType="rfq" status={rfq.status} showContext />
            <AnonymousBadge isAnonymous={rfq.anonymousBuyer} />
            {rfq.status === 'open' && <DeadlineCountdown deadline={rfq.deadline} />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {rfq.rfqNumber && `RFQ #${rfq.rfqNumber} • `}
            Created {formatDateTime(rfq.createdAt)} • Type: {rfq.type}
          </Typography>
        </Box>
        {isBuyer && (rfq.status === RFQStatus.DRAFT || rfq.status === RFQStatus.OPEN) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => validId && navigate(`/rfqs/${validId}/edit`)}
            >
              Edit
            </Button>
            {rfq.status === RFQStatus.OPEN && (
              <Button
                variant="outlined"
                color="warning"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                Cancel RFQ
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      {/* Anonymous Badge and Reveal Control */}
      {rfq.anonymousBuyer && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnonymousBadge isAnonymous={rfq.anonymousBuyer} />
              <Typography variant="body2">
                This RFQ is posted anonymously. Buyer identity will be revealed upon contract award.
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

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* What's Next Component - Enhanced */}
          <WorkflowNextStepsEnhanced
            entityType="rfq"
            status={rfq.status}
            entityId={validId}
            relatedEntities={[
              ...(acceptedBids.length > 0
                ? acceptedBids.slice(0, 3).map((bid: any) => ({
                    id: bid._id || bid.id || '',
                    type: 'contract' as const, // Accepted bids lead to contracts
                    label: `Bid #${(bid._id || bid.id || '').toString().slice(-6)} - Accepted`,
                    status: bid.status,
                    metadata: {
                      amount: bid.price,
                      currency: bid.currency,
                    },
                  }))
                : []),
            ]}
            onAction={handleWorkflowAction}
            notifications={[
              ...(bids.length > 0
                ? [
                    {
                      type: 'info' as const,
                      message: `${bids.length} bid${bids.length !== 1 ? 's' : ''} received. ${acceptedBids.length > 0 ? `${acceptedBids.length} accepted.` : 'Review and accept bids to proceed.'}`,
                    },
                  ]
                : []),
              ...(rfq.status === RFQStatus.CLOSED && acceptedBids.length === 0
                ? [
                    {
                      type: 'warning' as const,
                      message: 'RFQ closed but no bids accepted. Consider reopening or creating a new RFQ.',
                    },
                  ]
                : []),
            ]}
          />


          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {rfq.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Buyer Requirements */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assignment fontSize="small" />
                  Buyer Requirements
                </Typography>
                {rfq.anonymousBuyer && <AnonymousBadge isAnonymous={rfq.anonymousBuyer} />}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    General Requirements
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {rfq.description || 'No specific requirements provided.'}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Target Company Type
                  </Typography>
                  <Chip label={rfq.targetCompanyType || rfq.targetRole} size="small" variant="outlined" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Budget Range
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(rfq.budget, rfq.currency)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description fontSize="small" />
                Specifications
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Items ({rfq.items.length})
              </Typography>
              {rfq.items.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Quantity:</strong> {item.quantity} {item.unit}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Specifications:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {item.specifications}
                    </Typography>
                  </Box>
                  {index < rfq.items.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Schedule */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping fontSize="small" />
                Delivery Schedule
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Required Delivery Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(rfq.requiredDeliveryDate)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Bid Submission Deadline
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDateTime(rfq.deadline)}
                  </Typography>
                  {rfq.status === 'open' && (
                    <Box sx={{ mt: 1 }}>
                      <DeadlineCountdown deadline={rfq.deadline} />
                    </Box>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Delivery Location
                  </Typography>
                  <Typography variant="body2">
                    {rfq.deliveryLocation.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rfq.deliveryLocation.city}, {rfq.deliveryLocation.state}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rfq.deliveryLocation.country} {rfq.deliveryLocation.zipCode}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Incoterms */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping fontSize="small" />
                Incoterms & Shipping Terms
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Incoterms details will be discussed during negotiation. Standard terms apply unless otherwise specified.
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Preferred Incoterms
                  </Typography>
                  <Typography variant="body2">
                    To be determined during bid evaluation
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Shipping Terms
                  </Typography>
                  <Typography variant="body2">
                    Delivery to specified location: {rfq.deliveryLocation.city}, {rfq.deliveryLocation.country}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFile fontSize="small" />
                Required Documents
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                The following documents may be required during the bidding process:
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'Company Registration Certificate',
                  'Tax Identification Number',
                  'Quality Certifications (if applicable)',
                  'Previous Work Samples/Portfolio',
                  'Financial Statements (if required)',
                  'Insurance Certificates',
                ].map((doc, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle fontSize="small" color="action" />
                    <Typography variant="body2">{doc}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Note: Specific document requirements will be communicated during the negotiation phase.
              </Typography>
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
                    {formatCurrency(rfq.budget, rfq.currency)}
                  </Typography>
                  {rfq.budget > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {(() => {
                        const vatBreakdown = calculateVAT(rfq.budget, 0.05, rfq.currency);
                        return (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Subtotal: {formatCurrency(vatBreakdown.subtotal, rfq.currency)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              VAT (5%): {formatCurrency(vatBreakdown.vatAmount, rfq.currency)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                              Total (incl. VAT): {formatCurrency(vatBreakdown.total, rfq.currency)}
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
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Deadline
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDateTime(rfq.deadline)}
                  </Typography>
                  {rfq.status === 'open' && (
                    <Box sx={{ mt: 1 }}>
                      <DeadlineCountdown deadline={rfq.deadline} />
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
                    {formatDate(rfq.requiredDeliveryDate)}
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
                    {rfq.deliveryLocation.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rfq.deliveryLocation.city}, {rfq.deliveryLocation.state}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rfq.deliveryLocation.country} {rfq.deliveryLocation.zipCode}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Target Role
                  </Typography>
                  <Chip label={rfq.targetRole} size="small" variant="outlined" />
                </Box>
                <Divider />
                {/* Category Information */}
                {(category || subCategory || rfq.categoryId || isLoadingCategory || isLoadingSubCategory) && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LabelIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Category
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {categoryName ? (
                        <Chip
                          label={categoryName}
                          size="small"
                          variant="outlined"
                          color="primary"
                          icon={<LabelIcon />}
                        />
                      ) : isLoadingCategory ? (
                        <Chip label="Loading category..." size="small" variant="outlined" />
                      ) : category ? (
                        <Chip
                          label={category.name || 'Unknown Category'}
                          size="small"
                          variant="outlined"
                          color="primary"
                          icon={<LabelIcon />}
                        />
                      ) : rfq.categoryId ? (
                        <Chip
                          label={`Category ID: ${rfq.categoryId.substring(0, 8)}...`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                      
                      {subCategoryName ? (
                        <Chip
                          label={subCategoryName}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 0.5 }}
                        />
                      ) : isLoadingSubCategory ? (
                        <Chip label="Loading sub-category..." size="small" variant="outlined" />
                      ) : subCategory ? (
                        <Chip
                          label={subCategory.name || 'Unknown Sub-Category'}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 0.5 }}
                        />
                      ) : rfq.subCategoryId ? (
                        <Chip
                          label={`Sub-Category ID: ${rfq.subCategoryId.substring(0, 8)}...`}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 0.5 }}
                        />
                      ) : null}
                    </Box>
                    {category?.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {category.description}
                      </Typography>
                    )}
                    {!category && rfq.categoryId && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Category information is being loaded...
                      </Typography>
                    )}
                  </Box>
                )}
                {rfq.anonymousBuyer && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Buyer Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AnonymousBadge isAnonymous={rfq.anonymousBuyer} />
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Action Card for Providers */}
          {!isBuyer && rfq.status === 'open' && !isOwnCompanyRFQ && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Interested?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Submit a bid for this RFQ to compete for the contract.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/bids/new?rfqId=${rfq.id || rfq._id}`)}
                >
                  Submit Bid
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Warning for own company RFQ */}
          {!isBuyer && rfq.status === 'open' && isOwnCompanyRFQ && (
            <Card>
              <CardContent>
                <Alert severity="info">
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    This RFQ belongs to your company
                  </Typography>
                  <Typography variant="body2">
                    You cannot submit a bid for an RFQ created by your own company.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Action Card for Buyers */}
          {isBuyer && rfq.status === 'open' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Bid Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Compare and evaluate bids received for this RFQ.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/rfqs/${rfq.id || rfq._id}/bids/compare`)}
                >
                  Compare Bids
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Activity History Tab */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Activity History" />
        </Tabs>
        <MuiBox sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Details content is already shown above */}
            </Box>
          )}
          {activeTab === 1 && validId && (
            <ActivityHistory
              resource="rfq"
              resourceId={id}
              title="RFQ Activity History"
              showExport={true}
            />
          )}
        </MuiBox>
      </Box>

      {/* Identity Reveal Modal */}
      <IdentityRevealModal
        open={revealModalOpen}
        onClose={() => setRevealModalOpen(false)}
        onConfirm={() => {
          if (id) {
            revealMutation.mutate(validId!, {
              onSuccess: () => {
                setRevealModalOpen(false);
              },
            });
          }
        }}
        resourceType="RFQ"
        resourceTitle={rfq.title}
        isPending={revealMutation.isPending}
      />
    </Box>
  );
};
