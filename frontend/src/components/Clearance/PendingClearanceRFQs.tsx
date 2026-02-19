import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Visibility,
  MoreVert,
  Assignment,
  Schedule,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/utils';

interface ClearanceRFQ {
  id: string;
  rfqId: string;
  title: string;
  deadline: string;
  budget: number;
  currency: string;
  status: 'pending' | 'reviewing' | 'documented';
  priority: 'high' | 'medium' | 'low';
  itemsCount: number;
  requiredDocuments: string[];
}

// Mock data - replace with actual API call
const mockRFQs: ClearanceRFQ[] = [
  {
    id: '1',
    rfqId: 'RFQ-2024-001',
    title: 'Electronics Import Clearance',
    deadline: '2024-02-15',
    budget: 50000,
    currency: 'USD',
    status: 'pending',
    priority: 'high',
    itemsCount: 15,
    requiredDocuments: ['Commercial Invoice', 'Packing List', 'Certificate of Origin'],
  },
  {
    id: '2',
    rfqId: 'RFQ-2024-002',
    title: 'Textile Goods Clearance',
    deadline: '2024-02-20',
    budget: 35000,
    currency: 'USD',
    status: 'reviewing',
    priority: 'medium',
    itemsCount: 8,
    requiredDocuments: ['Commercial Invoice', 'Packing List'],
  },
];

export const PendingClearanceRFQs = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null);
  const [rfqs] = useState<ClearanceRFQ[]>(mockRFQs);
  const isLoading = false;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, rfqId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRFQ(rfqId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRFQ(null);
  };

  const handleViewDetails = (rfqId: string) => {
    navigate(`/rfqs/${rfqId}`);
    handleMenuClose();
  };

  const handleSubmitBid = (rfqId: string) => {
    navigate(`/bids/new?rfqId=${rfqId}&type=clearance`);
    handleMenuClose();
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'info' => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'reviewing':
        return 'warning';
      case 'documented':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'default' => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (rfqs.length === 0) {
    return (
      <Alert severity="info">
        No pending clearance RFQs at this time.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
          Pending Clearance RFQs
        </Typography>
        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
          {rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''} pending
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#1E293B' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>RFQ ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Deadline</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Budget</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rfqs.map((rfq) => (
              <TableRow
                key={rfq.id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(51, 65, 85, 0.5)',
                    cursor: 'pointer',
                  },
                }}
                onClick={() => handleViewDetails(rfq.rfqId)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment fontSize="small" sx={{ color: '#87CEEB' }} />
                    <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 500 }}>
                      {rfq.rfqId}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#F1F5F9' }}>
                    {rfq.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" sx={{ color: '#CBD5E1' }} />
                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                      {formatDate(rfq.deadline)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoney fontSize="small" sx={{ color: '#CBD5E1' }} />
                    <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 500 }}>
                      {formatCurrency(rfq.budget, rfq.currency)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                    size="small"
                    color={getStatusColor(rfq.status)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={rfq.priority.charAt(0).toUpperCase() + rfq.priority.slice(1)}
                    size="small"
                    color={getPriorityColor(rfq.priority)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                    {rfq.itemsCount} item{rfq.itemsCount !== 1 ? 's' : ''}
                  </Typography>
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, rfq.rfqId)}
                    sx={{ color: '#CBD5E1' }}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => selectedRFQ && handleViewDetails(selectedRFQ)}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedRFQ && handleSubmitBid(selectedRFQ)}>
          <Assignment fontSize="small" sx={{ mr: 1 }} />
          Submit Bid
        </MenuItem>
      </Menu>
    </Box>
  );
};
