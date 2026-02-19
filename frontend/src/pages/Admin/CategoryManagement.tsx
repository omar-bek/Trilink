import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    FormControlLabel,
    Switch,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    useCategoryTree,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
} from '@/hooks/useCategories';
import { CreateCategoryDto, UpdateCategoryDto, CategoryTree } from '@/types/category';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

const createCategorySchema = yup.object({
    name: yup.string().required('Name is required'),
    nameAr: yup.string().optional(),
    description: yup.string().optional(),
    parentId: yup.string().optional(),
});

const updateCategorySchema = yup.object({
    name: yup.string().optional(),
    nameAr: yup.string().optional(),
    description: yup.string().optional(),
    parentId: yup.string().optional(),
    isActive: yup.boolean().optional(),
});

export const CategoryManagement = () => {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryTree | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const { data: treeData, isLoading } = useCategoryTree();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const categories = treeData?.data || [];

    const {
        control: createControl,
        handleSubmit: handleCreateSubmit,
        reset: resetCreate,
        formState: { errors: createErrors },
    } = useForm<CreateCategoryDto>({
        resolver: yupResolver(createCategorySchema),
        defaultValues: {
            name: '',
            nameAr: '',
            description: '',
            parentId: '',
        },
    });

    const {
        control: editControl,
        handleSubmit: handleEditSubmit,
        reset: resetEdit,
        formState: { errors: editErrors },
    } = useForm<UpdateCategoryDto>({
        resolver: yupResolver(updateCategorySchema),
        defaultValues: {
            name: '',
            nameAr: '',
            description: '',
            isActive: true,
        },
    });

    const handleCreateOpen = (parentId?: string) => {
        resetCreate({ parentId: parentId || '' });
        setCreateDialogOpen(true);
    };

    const handleEditOpen = (category: CategoryTree) => {
        setSelectedCategory(category);
        resetEdit({
            name: category.name,
            nameAr: category.nameAr,
            description: category.description,
            isActive: category.isActive,
        });
        setEditDialogOpen(true);
    };

    const handleDeleteOpen = (category: CategoryTree) => {
        setSelectedCategory(category);
        setDeleteDialogOpen(true);
    };

    const onCreateSubmit = async (data: CreateCategoryDto) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                setCreateDialogOpen(false);
                resetCreate();
            },
        });
    };

    const onEditSubmit = async (data: UpdateCategoryDto) => {
        if (!selectedCategory) return;
        updateMutation.mutate(
            { id: selectedCategory.id, data },
            {
                onSuccess: () => {
                    setEditDialogOpen(false);
                    setSelectedCategory(null);
                },
            }
        );
    };

    const handleDelete = () => {
        if (!selectedCategory) return;
        deleteMutation.mutate(selectedCategory.id, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedCategory(null);
            },
        });
    };

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const renderCategoryTree = (category: CategoryTree, level = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <Box key={category.id} sx={{ ml: level * 4, mb: 1 }}>
                <Card variant="outlined">
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                {hasChildren && (
                                    <IconButton size="small" onClick={() => toggleExpand(category.id)}>
                                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                )}
                                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                    {category.name}
                                    {category.nameAr && (
                                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                            ({category.nameAr})
                                        </Typography>
                                    )}
                                </Typography>
                                <Chip
                                    label={category.isActive ? 'Active' : 'Inactive'}
                                    color={category.isActive ? 'success' : 'default'}
                                    size="small"
                                />
                                <Chip label={`Level ${category.level}`} size="small" variant="outlined" />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" onClick={() => handleCreateOpen(category.id)} color="primary">
                                    <AddIcon />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleEditOpen(category)} color="primary">
                                    <EditIcon />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDeleteOpen(category)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        </Box>
                        {category.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {category.description}
                            </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Path: {category.path}
                        </Typography>
                    </CardContent>
                </Card>
                {hasChildren && isExpanded && (
                    <Box sx={{ mt: 1 }}>
                        {category.children!.map((child) => renderCategoryTree(child, level + 1))}
                    </Box>
                )}
            </Box>
        );
    };

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Category Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleCreateOpen()}
                >
                    Add Root Category
                </Button>
            </Box>

            {categories.length === 0 ? (
                <Alert severity="info">No categories found. Create your first category to get started.</Alert>
            ) : (
                <Box>
                    {categories.map((category) => renderCategoryTree(category))}
                </Box>
            )}

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Category</DialogTitle>
                <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Controller
                                    name="name"
                                    control={createControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Name"
                                            required
                                            error={!!createErrors.name}
                                            helperText={createErrors.name?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="nameAr"
                                    control={createControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Arabic Name (Optional)"
                                            error={!!createErrors.nameAr}
                                            helperText={createErrors.nameAr?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="description"
                                    control={createControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Description (Optional)"
                                            multiline
                                            rows={3}
                                            error={!!createErrors.description}
                                            helperText={createErrors.description?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                            {createMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Category</DialogTitle>
                <form onSubmit={handleEditSubmit(onEditSubmit)}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Controller
                                    name="name"
                                    control={editControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Name"
                                            error={!!editErrors.name}
                                            helperText={editErrors.name?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="nameAr"
                                    control={editControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Arabic Name"
                                            error={!!editErrors.nameAr}
                                            helperText={editErrors.nameAr?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="description"
                                    control={editControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Description"
                                            multiline
                                            rows={3}
                                            error={!!editErrors.description}
                                            helperText={editErrors.description?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="isActive"
                                    control={editControl}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch {...field} checked={field.value ?? true} />}
                                            label="Active"
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <CircularProgress size={20} /> : 'Update'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Category</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
                        {selectedCategory?.children && selectedCategory.children.length > 0 && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                This category has {selectedCategory.children.length} sub-category(ies).
                                Please delete or move them first.
                            </Alert>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
