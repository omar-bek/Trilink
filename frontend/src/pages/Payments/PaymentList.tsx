import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  Button,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Payment as PaymentIcon, Search as SearchIcon, Clear as ClearIcon, Download as DownloadIcon } from '@mui/icons-material';
import { usePayments } from '@/hooks/usePayments';
import { PaymentStatus, PaymentFilters, Payment } from '@/types/payment';
import { PaymentListItem } from '@/components/Payment/PaymentListItem';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { EmptyState } from '@/components/Empty/EmptyState';
import { ErrorHandler } from '@/components/Error/ErrorHandler';
import { ResponsiveTable } from '@/components/common';
import { PaymentStatusBadge } from '@/components/Payment/PaymentStatusBadge';
import { formatCurrency, formatDate } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { isValidId } from '@/utils/routeValidation';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { exportToCSV } from '@/utils/export';

export const PaymentList = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: PaymentFilters = statusFilter !== 'all' ? { status: statusFilter } : {};
  const { data, isLoading, error } = usePayments(filters);
  
  // Handle both array and paginated response
  const payments = useMemo(() => {
    if (!data?.data) return [];
    if ('data' in data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  // Filter by search query
  const filteredPayments = useMemo(() => {
    if (!debouncedSearch.trim()) return payments;
    const query = debouncedSearch.toLowerCase();
    return payments.filter((payment: any) =>
      payment.milestone?.toLowerCase().includes(query) ||
      payment.notes?.toLowerCase().includes(query)
    );
  }, [payments, debouncedSearch]);

  // Pagination
  const paginatedPayments = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredPayments.map((payment: any) => ({
      Milestone: payment.milestone || 'N/A',
      Status: payment.status || 'N/A',
      Amount: formatCurrency(payment.totalAmount || payment.amount, payment.currency),
      'Due Date': payment.dueDate ? formatDate(payment.dueDate) : 'N/A',
      'Paid Date': payment.paidDate ? formatDate(payment.paidDate) : 'N/A',
      VAT: payment.vatAmount ? formatCurrency(payment.vatAmount, payment.currency) : 'N/A',
      Notes: payment.notes || 'N/A',
    }));

    exportToCSV(exportData, 'payments');
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <ErrorHandler
        error={error}
        onRetry={() => window.location.reload()}
        context="Payments"
        fullPage={false}
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track payment milestones
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={filteredPayments.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by milestone, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={PaymentStatus.PENDING_APPROVAL}>Pending Approval</MenuItem>
                <MenuItem value={PaymentStatus.APPROVED}>Approved</MenuItem>
                <MenuItem value={PaymentStatus.REJECTED}>Rejected</MenuItem>
                <MenuItem value={PaymentStatus.PROCESSING}>Processing</MenuItem>
                <MenuItem value={PaymentStatus.COMPLETED}>Completed</MenuItem>
                <MenuItem value={PaymentStatus.FAILED}>Failed</MenuItem>
                <MenuItem value={PaymentStatus.CANCELLED}>Cancelled</MenuItem>
                <MenuItem value={PaymentStatus.REFUNDED}>Refunded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters Chips */}
        {(debouncedSearch || statusFilter !== 'all') && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {debouncedSearch && (
              <Chip
                label={`Search: "${debouncedSearch}"`}
                onDelete={() => setSearchQuery('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {statusFilter !== 'all' && (
              <Chip
                label={`Status: ${statusFilter}`}
                onDelete={() => setStatusFilter('all')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Payments List */}
      {filteredPayments.length === 0 && !isLoading ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {debouncedSearch || statusFilter !== 'all'
              ? 'No payments found'
              : 'No payments yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {debouncedSearch || statusFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Payments will appear here once they are created from contracts.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <ResponsiveTable
            columns={[
            {
              id: 'milestone',
              label: 'Milestone',
              priority: 'high',
              render: (payment) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {payment.milestone}
                </Typography>
              ),
              mobileLabel: 'Payment',
            },
            {
              id: 'status',
              label: 'Status',
              priority: 'high',
              render: (payment) => <PaymentStatusBadge status={payment.status} />,
            },
            {
              id: 'amount',
              label: 'Amount',
              priority: 'high',
              render: (payment) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(payment.totalAmount || payment.amount, payment.currency)}
                </Typography>
              ),
              align: 'right',
              width: 120,
            },
            {
              id: 'dueDate',
              label: 'Due Date',
              priority: 'medium',
              render: (payment) => {
                const isOverdue = new Date(payment.dueDate) < new Date() && payment.status !== 'completed';
                return (
                  <Chip
                    label={formatDate(payment.dueDate)}
                    size="small"
                    variant="outlined"
                    color={isOverdue ? 'error' : 'default'}
                  />
                );
              },
              mobileLabel: 'Due Date',
            },
            {
              id: 'paidDate',
              label: 'Paid Date',
              priority: 'low',
              render: (payment) =>
                payment.paidDate ? (
                  <Typography variant="body2" color="success.main">
                    {formatDate(payment.paidDate)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Not paid
                  </Typography>
                ),
              mobileLabel: 'Paid Date',
            },
            {
              id: 'vat',
              label: 'VAT',
              priority: 'low',
              render: (payment) =>
                payment.vatAmount && payment.vatAmount > 0 ? (
                  <Typography variant="body2">
                    {formatCurrency(payment.vatAmount, payment.currency)} (
                    {((payment.vatRate || 0.05) * 100).toFixed(0)}%)
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                ),
              align: 'right',
              width: 100,
            },
            {
              id: 'notes',
              label: 'Notes',
              priority: 'low',
              render: (payment) =>
                payment.notes ? (
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: { xs: '100%', md: 200 },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {payment.notes}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No notes
                  </Typography>
                ),
              mobileLabel: 'Notes',
            },
            ]}
            data={paginatedPayments}
            keyExtractor={(payment) => payment._id || payment.id || ''}
            emptyMessage={
              debouncedSearch || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No payments available'
            }
            onRowClick={(payment) => {
              const paymentId = payment._id || payment.id;
              if (paymentId && isValidId(paymentId)) {
                navigate(`/payments/${paymentId}`);
              } else {
                console.warn('Invalid payment ID:', paymentId);
              }
            }}
            mobileCardRenderer={(payment) => <PaymentListItem payment={payment} />}
            tableProps={{ stickyHeader: true }}
          />
          {filteredPayments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                page={page}
                limit={rowsPerPage}
                total={filteredPayments.length}
                totalPages={totalPages}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setRowsPerPage(newLimit);
                  setPage(1);
                }}
                limitOptions={[5, 10, 25, 50]}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
