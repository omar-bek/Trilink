import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useCompanyCategories, useAddCategoriesToCompany, useRemoveCategoryFromCompany } from '@/hooks/useCompanyCategories';
import { useAllCategories } from '@/hooks/useCategories';
import { Category } from '@/types/category';

interface CompanyCategoryAssignmentProps {
  companyId: string;
  companyName?: string;
}

export const CompanyCategoryAssignment = ({ companyId, companyName }: CompanyCategoryAssignmentProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const { data: companyCategoriesData, isLoading: isLoadingCompanyCategories } = useCompanyCategories(companyId);
  const { data: allCategoriesData, isLoading: isLoadingAllCategories } = useAllCategories(false);
  const addMutation = useAddCategoriesToCompany();
  const removeMutation = useRemoveCategoryFromCompany();

  const companyCategories = companyCategoriesData?.data || [];
  const allCategories = allCategoriesData?.data || [];

  // Filter out categories already assigned to company
  const availableCategories = allCategories.filter(
    (cat) => !companyCategories.some((cc) => cc.id === cat.id)
  );

  const handleAddOpen = () => {
    setSelectedCategoryIds([]);
    setAddDialogOpen(true);
  };

  const handleAddCategories = () => {
    if (selectedCategoryIds.length === 0) {
      return;
    }

    addMutation.mutate(
      { companyId, categoryIds: selectedCategoryIds },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setSelectedCategoryIds([]);
        },
      }
    );
  };

  const handleRemoveCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to remove this category from the company?')) {
      removeMutation.mutate({ companyId, categoryId });
    }
  };

  if (isLoadingCompanyCategories) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Company Specializations
            {companyName && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({companyName})
              </Typography>
            )}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddOpen}
            disabled={isLoadingAllCategories || availableCategories.length === 0}
          >
            Add Categories
          </Button>
        </Box>

        {companyCategories.length === 0 ? (
          <Alert severity="info">
            No categories assigned. Click "Add Categories" to assign specializations to this company.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {companyCategories.map((category) => (
              <Chip
                key={category.id}
                label={`${category.name}${category.nameAr ? ` (${category.nameAr})` : ''}`}
                onDelete={() => handleRemoveCategory(category.id)}
                color="primary"
                variant="outlined"
                deleteIcon={<DeleteIcon />}
              />
            ))}
          </Box>
        )}

        {/* Add Categories Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Categories to Company</DialogTitle>
          <DialogContent>
            {isLoadingAllCategories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : availableCategories.length === 0 ? (
              <Alert severity="info">All available categories are already assigned to this company.</Alert>
            ) : (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Categories</InputLabel>
                <Select
                  multiple
                  value={selectedCategoryIds}
                  onChange={(e) => setSelectedCategoryIds(e.target.value as string[])}
                  label="Select Categories"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((id) => {
                        const category = allCategories.find((c) => c.id === id);
                        return category ? (
                          <Chip key={id} label={category.name} size="small" />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {availableCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                      {category.nameAr && ` (${category.nameAr})`}
                      {category.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          - {category.description}
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddCategories}
              variant="contained"
              disabled={selectedCategoryIds.length === 0 || addMutation.isPending}
            >
              {addMutation.isPending ? <CircularProgress size={20} /> : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
