/**
 * RFQ Inbox Component
 * 
 * Service provider RFQ inbox with filtering and service type support
 */

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EnterpriseDataTable, Column } from '@/components/DataTable';
import { EnterpriseCard } from '@/components/common';
import { StatusBadge } from '@/components/common';
import { useQuery } from '@tanstack/react-query';
import { rfqService } from '@/services/rfq.service';
import { queryKeys } from '@/lib/queryKeys';
import { RFQType } from '@/types/rfq';
import { RFQStatus } from '@/types/rfq';
import { ServiceType, ServiceTypeConfig } from '@/config/serviceProvider';
import { designTokens } from '@/theme/designTokens';

const { spacing } = designTokens;

interface RFQInboxProps {
  serviceType: ServiceType;
  serviceConfig: ServiceTypeConfig;
}

export const RFQInbox = ({ serviceType, serviceConfig }: RFQInboxProps) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RFQStatus | 'all'>('all');

  // Fetch RFQs for this service type
  const { data: rfqsData, isLoading } = useQuery({
    queryKey: queryKeys.rfqs.list({ type: RFQType.SERVICE_PROVIDER, status: statusFilter === 'all' ? undefined : statusFilter }),
    queryFn: () => rfqService.getRFQs({ type: RFQType.SERVICE_PROVIDER, status: statusFilter === 'all' ? undefined : statusFilter }),
    enabled: serviceConfig.workflow.hasRFQInbox,
  });

  const rfqs = rfqsData?.data || [];

  const columns: Column<any>[] = [
    {
      id: 'rfqNumber',
      label: 'RFQ Number',
      sortable: true,
      render: (value, row) => (
        <Typography
          variant="body2"
          sx={{
            color: designTokens.colors.intelligence.ceruleanLight,
            cursor: 'pointer',
            fontWeight: 500,
            '&:hover': { textDecoration: 'underline' },
          }}
          onClick={() => navigate(`/rfqs/${row._id}`)}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'title',
      label: 'Title',
      sortable: true,
    },
    {
      id: 'buyer',
      label: 'Buyer',
      render: (value, row) => row.buyerCompany?.name || 'N/A',
    },
    {
      id: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge
          status={
            value === RFQStatus.OPEN
              ? 'info'
              : value === RFQStatus.CLOSED
              ? 'neutral'
              : 'warning'
          }
          label={value}
          size="small"
        />
      ),
    },
    {
      id: 'deadline',
      label: 'Bid Deadline',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      id: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleStatusChange = (_event: React.SyntheticEvent, newValue: RFQStatus | 'all') => {
    setStatusFilter(newValue);
  };

  const statusCounts = {
    all: rfqs.length,
    [RFQStatus.OPEN]: rfqs.filter((r: any) => r.status === RFQStatus.OPEN).length,
    [RFQStatus.CLOSED]: rfqs.filter((r: any) => r.status === RFQStatus.CLOSED).length,
    [RFQStatus.DRAFT]: rfqs.filter((r: any) => r.status === RFQStatus.DRAFT).length,
  };

  return (
    <EnterpriseCard
      title={`${serviceConfig.displayName} - RFQ Inbox`}
      subtitle="Review and respond to RFQs for your service type"
    >
      <Box sx={{ mb: spacing.lg }}>
        <Tabs
          value={statusFilter}
          onChange={handleStatusChange}
          sx={{
            borderBottom: `1px solid ${designTokens.borders.color.default}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                All RFQs
                <Chip label={statusCounts.all} size="small" sx={{ height: 20 }} />
              </Box>
            }
            value="all"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Open
                <Chip label={statusCounts[RFQStatus.OPEN]} size="small" sx={{ height: 20 }} />
              </Box>
            }
            value={RFQStatus.OPEN}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Closed
                <Chip label={statusCounts[RFQStatus.CLOSED]} size="small" sx={{ height: 20 }} />
              </Box>
            }
            value={RFQStatus.CLOSED}
          />
        </Tabs>
      </Box>

      <EnterpriseDataTable
        columns={columns}
        rows={rfqs}
        keyField="_id"
        sortable
        pagination
        loading={isLoading}
        emptyMessage="No RFQs available for this service type"
      />
    </EnterpriseCard>
  );
};