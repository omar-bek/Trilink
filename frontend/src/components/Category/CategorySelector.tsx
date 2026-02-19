import { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    CircularProgress,
    Box,
} from '@mui/material';
import { Controller, Control, useWatch } from 'react-hook-form';
import { useRootCategories, useCategoryChildren, useCategoryStats } from '@/hooks/useCategories';

interface CategorySelectorProps {
    control: Control<any>;
    name: string;
    subCategoryName?: string;
    label?: string;
    subCategoryLabel?: string;
    required?: boolean;
    error?: boolean;
    helperText?: string;
}

export const CategorySelector = ({
    control,
    name,
    subCategoryName = 'subCategoryId',
    label = 'Category',
    subCategoryLabel = 'Sub-Category (Optional)',
    required = true,
    error,
    helperText,
}: CategorySelectorProps) => {
    const { data: rootCategoriesData, isLoading: isLoadingRoot, error: rootCategoriesError, refetch: refetchRootCategories } = useRootCategories();
    const { data: statsData } = useCategoryStats();

    // Extract categories from response - handle both direct array and ApiResponse structure
    let rootCategories: any[] = [];

    if (rootCategoriesData) {
        // Check if it's already an array
        if (Array.isArray(rootCategoriesData)) {
            rootCategories = rootCategoriesData;
            console.log('✅ Categories is direct array, length:', rootCategories.length);
        }
        // Check if it's ApiResponse with data property
        else if (rootCategoriesData && typeof rootCategoriesData === 'object') {
            console.log('📦 rootCategoriesData is object, keys:', Object.keys(rootCategoriesData));

            // Try data property
            if ('data' in rootCategoriesData && rootCategoriesData.data !== undefined) {
                if (Array.isArray(rootCategoriesData.data)) {
                    rootCategories = rootCategoriesData.data;
                    console.log('✅ Found categories in rootCategoriesData.data, length:', rootCategories.length);
                } else {
                    console.warn('⚠️ rootCategoriesData.data exists but is not an array:', typeof rootCategoriesData.data);
                }
            }
            // Try success.data structure
            else if (rootCategoriesData.success && (rootCategoriesData as any).data) {
                if (Array.isArray((rootCategoriesData as any).data)) {
                    rootCategories = (rootCategoriesData as any).data;
                    console.log('✅ Found categories in rootCategoriesData.success.data, length:', rootCategories.length);
                }
            } else {
                console.warn('⚠️ Could not find data in rootCategoriesData structure');
            }
        }
    } else {
        console.warn('⚠️ rootCategoriesData is null or undefined');
    }

    // Ensure all categories have proper structure
    rootCategories = rootCategories.map((cat: any) => {
        // Normalize category structure
        const normalized = {
            id: cat.id || cat._id?.toString() || '',
            name: cat.name || cat.categoryName || cat.title || '',
            nameAr: cat.nameAr || cat.arabicName || '',
            ...cat, // Keep all other fields
        };
        return normalized;
    }).filter((cat: any) => {
        // Only require id - name can be empty (will show fallback)
        const hasId = cat.id && cat.id !== '';
        if (!hasId) {
            console.warn('Filtered out category (missing id):', cat);
        }
        return hasId;
    });

    // Debug: Log categories data
    useEffect(() => {
        console.log('=== CategorySelector Debug ===');
        console.log('isLoadingRoot:', isLoadingRoot);
        console.log('rootCategoriesError:', rootCategoriesError);
        console.log('rootCategoriesData (raw):', rootCategoriesData);
        console.log('rootCategoriesData type:', typeof rootCategoriesData);
        console.log('rootCategoriesData isArray:', Array.isArray(rootCategoriesData));
        if (rootCategoriesData && typeof rootCategoriesData === 'object') {
            console.log('rootCategoriesData keys:', Object.keys(rootCategoriesData));
            if ('data' in rootCategoriesData) {
                console.log('rootCategoriesData.data:', rootCategoriesData.data);
                console.log('rootCategoriesData.data type:', typeof rootCategoriesData.data);
                console.log('rootCategoriesData.data isArray:', Array.isArray(rootCategoriesData.data));
            }
        }
        console.log('rootCategories (extracted):', rootCategories);
        console.log('rootCategories length:', rootCategories.length);
        console.log('rootCategories type:', Array.isArray(rootCategories) ? 'array' : typeof rootCategories);

        if (rootCategories.length > 0) {
            console.log('✅ Categories found!');
            console.log('First category:', rootCategories[0]);
            console.log('First category keys:', Object.keys(rootCategories[0]));
            console.log('First category.name:', rootCategories[0].name);
            console.log('First category.nameAr:', rootCategories[0].nameAr);
            console.log('First category JSON:', JSON.stringify(rootCategories[0], null, 2));
        } else {
            console.warn('⚠️ No categories extracted!');
            console.warn('rootCategoriesData structure:', JSON.stringify(rootCategoriesData, null, 2));

            // Log stats if available
            if (statsData?.data) {
                console.log('📊 Category Stats:', statsData.data);
                console.log('Total categories in DB:', statsData.data.totalCategories);
                console.log('Active categories:', statsData.data.activeCategories);
                console.log('Root categories:', statsData.data.rootCategories);
                if (statsData.data.sampleCategories && statsData.data.sampleCategories.length > 0) {
                    console.log('Sample categories from DB:', statsData.data.sampleCategories);
                }
            }
        }
        console.log('=============================');

        // If no categories and not loading, try to refetch once
        if (!isLoadingRoot && rootCategories.length === 0 && !rootCategoriesError) {
            console.warn('⚠️ No categories found, attempting refetch...');
            setTimeout(() => {
                refetchRootCategories();
            }, 2000);
        }
    }, [rootCategoriesData, rootCategories, rootCategoriesError, isLoadingRoot, refetchRootCategories]);

    // Watch the category field value to sync with selectedCategoryId
    const categoryValue = useWatch({ control, name });

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryValue || '');

    // Sync selectedCategoryId when categoryValue changes (e.g., form reset or load)
    useEffect(() => {
        if (categoryValue !== selectedCategoryId) {
            setSelectedCategoryId(categoryValue || '');
        }
    }, [categoryValue, selectedCategoryId]);

    const { data: subCategoriesData, isLoading: isLoadingSub } = useCategoryChildren(
        selectedCategoryId || undefined
    );
    const subCategories = subCategoriesData?.data || [];

    return (
        <>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? 'Category is required' : false }}
                render={({ field, fieldState }) => (
                    <FormControl fullWidth error={fieldState.invalid || error} required={required}>
                        <InputLabel>{label}</InputLabel>
                        <Select
                            {...field}
                            label={label}
                            disabled={isLoadingRoot}
                            value={field.value || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value);
                                setSelectedCategoryId(value);
                            }}
                        >
                            {isLoadingRoot ? (
                                <MenuItem disabled>
                                    <CircularProgress size={20} />
                                    <Box component="span" sx={{ ml: 1 }}>Loading categories...</Box>
                                </MenuItem>
                            ) : rootCategoriesError ? (
                                <MenuItem disabled sx={{ color: 'error.main' }}>
                                    Error: {rootCategoriesError?.message || 'Failed to load categories'}
                                </MenuItem>
                            ) : rootCategories.length === 0 ? (
                                <MenuItem disabled>
                                    No categories available. Please create categories first.
                                </MenuItem>
                            ) : (
                                rootCategories.map((category: any, index: number) => {
                                    const categoryId = category.id || category._id?.toString() || `cat-${index}`;
                                    const categoryName = category.name || category.categoryName || category.title || `Category ${index + 1}`;
                                    const categoryNameAr = category.nameAr || category.arabicName;

                                    if (!categoryId) {
                                        console.warn('Invalid category (missing id):', category);
                                        return null;
                                    }

                                    return (
                                        <MenuItem
                                            key={categoryId}
                                            value={categoryId}
                                        >
                                            {categoryName}
                                            {categoryNameAr && ` (${categoryNameAr})`}
                                        </MenuItem>
                                    );
                                }).filter(Boolean)
                            )}
                        </Select>
                        {(fieldState.error || helperText) && (
                            <FormHelperText>{fieldState.error?.message || helperText}</FormHelperText>
                        )}
                    </FormControl>
                )}
            />

            {selectedCategoryId && (
                <Box sx={{ mt: 2 }}>
                    <Controller
                        name={subCategoryName}
                        control={control}
                        render={({ field, fieldState }) => (
                            <FormControl fullWidth error={fieldState.invalid} sx={{ mt: 1 }}>
                                <InputLabel>{subCategoryLabel}</InputLabel>
                                <Select
                                    {...field}
                                    label={subCategoryLabel}
                                    disabled={isLoadingSub || !selectedCategoryId}
                                    value={field.value || ''}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {isLoadingSub ? (
                                        <MenuItem disabled>
                                            <CircularProgress size={20} />
                                        </MenuItem>
                                    ) : subCategories.length === 0 ? (
                                        <MenuItem disabled>No sub-categories available</MenuItem>
                                    ) : (
                                        subCategories.map((subCategory: any) => {
                                            const subCategoryId = subCategory.id || subCategory._id;
                                            const subCategoryName = subCategory.name || subCategory.categoryName || subCategory.title || 'Sub-Category';
                                            const subCategoryNameAr = subCategory.nameAr || subCategory.arabicName;

                                            return (
                                                <MenuItem key={subCategoryId} value={subCategoryId}>
                                                    {subCategoryName}
                                                    {subCategoryNameAr && ` (${subCategoryNameAr})`}
                                                </MenuItem>
                                            );
                                        })
                                    )}
                                </Select>
                                {fieldState.error && (
                                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}
                    />
                </Box>
            )}
        </>
    );
};
