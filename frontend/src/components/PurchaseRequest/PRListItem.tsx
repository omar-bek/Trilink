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
  Edit,
  Send,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseRequest, PurchaseRequestStatus } from '@/types/purchase-request';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '@/utils';
import { useCategory } from '@/hooks/useCategories';
import { Label as LabelIcon } from '@mui/icons-material';

interface PRListItemProps {
  purchaseRequest: PurchaseRequest;
  onEdit?: (id: string) => void;
  onSubmit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const PRListItem = ({
  purchaseRequest,
  onEdit,
  onSubmit,
  onDelete,
}: PRListItemProps) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Use category names from API if available, otherwise fetch
  const categoryName = purchaseRequest.categoryName;
  const subCategoryName = purchaseRequest.subCategoryName;
  
  // Fetch category information only if names are not provided
  const { data: categoryData, isLoading: isLoadingCategory } = useCategory(
    (!categoryName && purchaseRequest.categoryId) ? purchaseRequest.categoryId : undefined
  );
  const { data: subCategoryData, isLoading: isLoadingSubCategory } = useCategory(
    (!subCategoryName && purchaseRequest.subCategoryId) ? purchaseRequest.subCategoryId : undefined
  );
  const category = categoryData?.data;
  const subCategory = subCategoryData?.data;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const purchaseRequestId = purchaseRequest._id || purchaseRequest.id;

  const handleView = () => {
    if (purchaseRequestId) {
      navigate(`/purchase-requests/${purchaseRequestId}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (!purchaseRequestId) return;
    if (onEdit) {
      onEdit(purchaseRequestId);
    } else {
      navigate(`/purchase-requests/${purchaseRequestId}/edit`);
    }
    handleMenuClose();
  };

  const handleSubmit = () => {
    if (!purchaseRequestId) return;
    if (onSubmit) {
      onSubmit(purchaseRequestId);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (!purchaseRequestId) return;
    if (onDelete) {
      onDelete(purchaseRequestId);
    }
    handleMenuClose();
  };

  const canEdit = purchaseRequest.status === PurchaseRequestStatus.DRAFT;
  const canSubmit = purchaseRequest.status === PurchaseRequestStatus.DRAFT;

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
        if (purchaseRequestId) {
          handleView();
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {purchaseRequest.title}
              </Typography>
              <StatusBadge status={purchaseRequest.status} rfqGenerated={purchaseRequest.rfqGenerated} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {purchaseRequest.description}
            </Typography>
            {(categoryName || category || subCategoryName || subCategory || purchaseRequest.categoryId) && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {categoryName ? (
                  <Chip
                    label={categoryName}
                    size="small"
                    color="primary"
                    variant="outlined"
                    icon={<LabelIcon />}
                  />
                ) : isLoadingCategory ? (
                  <Chip label="Loading..." size="small" variant="outlined" />
                ) : category ? (
                  <Chip
                    label={category.name || 'Unknown Category'}
                    size="small"
                    color="primary"
                    variant="outlined"
                    icon={<LabelIcon />}
                  />
                ) : purchaseRequest.categoryId ? (
                  <Chip
                    label={`Category ID: ${purchaseRequest.categoryId.substring(0, 8)}...`}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                ) : null}
                {subCategoryName ? (
                  <Chip
                    label={subCategoryName}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                ) : isLoadingSubCategory ? (
                  <Chip label="Loading..." size="small" variant="outlined" />
                ) : subCategory ? (
                  <Chip
                    label={subCategory.name || 'Unknown Sub-Category'}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                ) : purchaseRequest.subCategoryId ? (
                  <Chip
                    label={`Sub-Category ID: ${purchaseRequest.subCategoryId.substring(0, 8)}...`}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                ) : null}
              </Box>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip
                label={`${purchaseRequest.items.length} item${purchaseRequest.items.length !== 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={formatCurrency(purchaseRequest.budget, purchaseRequest.currency)}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip
                label={`Delivery: ${formatDate(purchaseRequest.requiredDeliveryDate)}`}
                size="small"
                variant="outlined"
              />
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
          {canEdit && (
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          )}
          {canSubmit && (
            <MenuItem onClick={handleSubmit}>
              <ListItemIcon>
                <Send fontSize="small" />
              </ListItemIcon>
              <ListItemText>Submit</ListItemText>
            </MenuItem>
          )}
          {canEdit && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};
