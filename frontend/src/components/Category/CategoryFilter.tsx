import { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
} from '@mui/material';
import { useRootCategories, useCategoryChildren } from '@/hooks/useCategories';
import { Category } from '@/types/category';

interface CategoryFilterProps {
  value: string;
  onChange: (categoryId: string) => void;
  subCategoryId?: string;
  onSubCategoryChange?: (subCategoryId: string) => void;
  label?: string;
  subCategoryLabel?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  showSubCategory?: boolean;
}

export const CategoryFilter = ({
  value,
  onChange,
  subCategoryId,
  onSubCategoryChange,
  label = 'Category',
  subCategoryLabel = 'Sub-Category',
  size = 'small',
  fullWidth = true,
  showSubCategory = true,
}: CategoryFilterProps) => {
  const { data: rootCategoriesData, isLoading: isLoadingRoot } = useRootCategories();
  const rootCategories = rootCategoriesData?.data || [];

  const { data: subCategoriesData, isLoading: isLoadingSub } = useCategoryChildren(
    value || undefined
  );
  const subCategories = subCategoriesData?.data || [];

  return (
    <Box>
      <FormControl fullWidth={fullWidth} size={size}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value || ''}
          label={label}
          disabled={isLoadingRoot}
          onChange={(e) => {
            onChange(e.target.value);
            // Reset sub-category when main category changes
            if (onSubCategoryChange) {
              onSubCategoryChange('');
            }
          }}
        >
          <MenuItem value="">
            <em>All Categories</em>
          </MenuItem>
          {isLoadingRoot ? (
            <MenuItem disabled>
              <CircularProgress size={20} />
            </MenuItem>
          ) : (
            rootCategories.map((category: Category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
                {category.nameAr && ` (${category.nameAr})`}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {showSubCategory && value && (
        <Box sx={{ mt: 1 }}>
          <FormControl fullWidth={fullWidth} size={size}>
            <InputLabel>{subCategoryLabel}</InputLabel>
            <Select
              value={subCategoryId || ''}
              label={subCategoryLabel}
              disabled={isLoadingSub || !value}
              onChange={(e) => {
                if (onSubCategoryChange) {
                  onSubCategoryChange(e.target.value);
                }
              }}
            >
              <MenuItem value="">
                <em>All Sub-Categories</em>
              </MenuItem>
              {isLoadingSub ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                </MenuItem>
              ) : (
                subCategories.map((subCategory: Category) => (
                  <MenuItem key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                    {subCategory.nameAr && ` (${subCategory.nameAr})`}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
};
