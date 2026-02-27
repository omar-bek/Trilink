/**
 * Service Provider Dashboard
 * 
 * Modular, configurable dashboard for service providers
 * Supports multiple service types with workflow-oriented design
 */

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Grid, Card, CardContent, Chip } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GridContainer, GridRow, GridColumn } from '@/components/Layout';
import { EnterpriseCard } from '@/components/common';
import { StatusBadge } from '@/components/common';
import { KPICard } from '@/components/Dashboard/KPICard';
import {
  RFQInbox,
  BidSubmission,
  NegotiationRoom,
  ContractAcceptance,
} from '@/components/ServiceProvider';
import {
  ServiceType,
  ServiceTypeConfig,
  SERVICE_TYPE_CONFIGS,
  getAllServiceTypes,
} from '@/config/serviceProvider';
import { designTokens } from '@/theme/designTokens';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/lib/queryKeys';
import { Role } from '@/types';
import {
  Inventory,
  VerifiedUser,
  Warehouse,
  Security,
  AccountBalance,
  Assignment,
  Gavel,
  AccountBalance as ContractIcon,
  Chat,
} from '@mui/icons-material';

const { spacing, colors } = designTokens;

// Workflow stages
type WorkflowStage = 'rfq-inbox' | 'bid-submission' | 'negotiation' | 'contract-acceptance';

export const ServiceProviderDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get service type from URL or default to first service
  const serviceTypeParam = searchParams.get('serviceType') as ServiceType | null;
  const workflowStageParam = searchParams.get('stage') as WorkflowStage | null;
  
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>(
    serviceTypeParam || ServiceType.PACKAGING_LABELING
  );
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState<WorkflowStage>(
    workflowStageParam || 'rfq-inbox'
  );

  const serviceConfig = SERVICE_TYPE_CONFIGS[selectedServiceType];

  // Fetch dashboard metrics for service provider
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.data(Role.SERVICE_PROVIDER),
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 5 * 60 * 1000,
  });

  const kpis = dashboardData?.data?.kpis;

  const handleServiceTypeChange = (_event: React.SyntheticEvent, newValue: ServiceType) => {
    setSelectedServiceType(newValue);
    setSearchParams({ serviceType: newValue, stage: selectedWorkflowStage });
  };

  const handleWorkflowStageChange = (_event: React.SyntheticEvent, newValue: WorkflowStage) => {
    setSelectedWorkflowStage(newValue);
    setSearchParams({ serviceType: selectedServiceType, stage: newValue });
  };

  // Get workflow stages for current service type
  const workflowStages = [
    serviceConfig.workflow.hasRFQInbox && {
      id: 'rfq-inbox' as WorkflowStage,
      label: 'RFQ Inbox',
      icon: <Assignment />,
    },
    serviceConfig.workflow.hasBidSubmission && {
      id: 'bid-submission' as WorkflowStage,
      label: 'Bid Submission',
      icon: <Gavel />,
    },
    serviceConfig.workflow.hasNegotiation && {
      id: 'negotiation' as WorkflowStage,
      label: 'Negotiation',
      icon: <Chat />,
    },
    serviceConfig.workflow.hasContractAcceptance && {
      id: 'contract-acceptance' as WorkflowStage,
      label: 'Contract Acceptance',
      icon: <ContractIcon />,
    },
  ].filter(Boolean) as Array<{ id: WorkflowStage; label: string; icon: React.ReactNode }>;

  // Render workflow component based on selected stage
  const renderWorkflowComponent = () => {
    const commonProps = {
      serviceType: selectedServiceType,
      serviceConfig,
    };

    switch (selectedWorkflowStage) {
      case 'rfq-inbox':
        return <RFQInbox {...commonProps} />;
      case 'bid-submission':
        return <BidSubmission {...commonProps} />;
      case 'negotiation':
        return <NegotiationRoom {...commonProps} />;
      case 'contract-acceptance':
        return <ContractAcceptance {...commonProps} />;
      default:
        return <RFQInbox {...commonProps} />;
    }
  };

  return (
    <GridContainer>
      <Box sx={{ mb: spacing.xl }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#FFFFFF', mb: 1 }}>
          Service Provider Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: colors.base.neutral300 }}>
          Manage your service offerings and respond to RFQs
        </Typography>
      </Box>

      {/* Service Type Selection */}
      <Box sx={{ mb: spacing.xl }}>
        <Typography variant="h6" gutterBottom sx={{ mb: spacing.md, color: '#FFFFFF' }}>
          Select Service Type
        </Typography>
        <Tabs
          value={selectedServiceType}
          onChange={handleServiceTypeChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${designTokens.borders.color.default}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 64,
            },
          }}
        >
          {getAllServiceTypes().map((service) => (
            <Tab
              key={service.id}
              value={service.id}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: service.color }}>{service.icon}</Box>
                  <Typography variant="body2">{service.displayName}</Typography>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* KPI Cards */}
      <GridRow gutter="default" sx={{ mb: spacing.xl }}>
        <GridColumn xs={12} sm={6} md={3}>
          <KPICard
            title="Total RFQs"
            value={kpis?.totalRFQs || 0}
            icon={<Assignment />}
            color="info"
            loading={isLoading}
          />
        </GridColumn>
        <GridColumn xs={12} sm={6} md={3}>
          <KPICard
            title="Active Bids"
            value={kpis?.totalBids || 0}
            icon={<Gavel />}
            color="primary"
            loading={isLoading}
          />
        </GridColumn>
        <GridColumn xs={12} sm={6} md={3}>
          <KPICard
            title="Contracts"
            value={kpis?.totalContracts || 0}
            icon={<ContractIcon />}
            color="success"
            loading={isLoading}
          />
        </GridColumn>
        <GridColumn xs={12} sm={6} md={3}>
          <KPICard
            title="Win Rate"
            value="68%"
            icon={<VerifiedUser />}
            color="warning"
            loading={isLoading}
          />
        </GridColumn>
      </GridRow>

      {/* Service Info Card */}
      <EnterpriseCard
        title={serviceConfig.displayName}
        subtitle={serviceConfig.description}
        variant="outlined"
        sx={{ mb: spacing.xl }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
          <Chip
            label={`Service Type: ${serviceConfig.displayName}`}
            color="primary"
            size="small"
          />
          <Chip
            label={`Color: ${serviceConfig.color}`}
            sx={{ backgroundColor: serviceConfig.color, color: '#FFFFFF' }}
            size="small"
          />
        </Box>
      </EnterpriseCard>

      {/* Workflow Navigation */}
      <Box sx={{ mb: spacing.xl }}>
        <Typography variant="h6" gutterBottom sx={{ mb: spacing.md, color: '#FFFFFF' }}>
          Workflow
        </Typography>
        <Tabs
          value={selectedWorkflowStage}
          onChange={handleWorkflowStageChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${designTokens.borders.color.default}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 56,
            },
          }}
        >
          {workflowStages.map((stage) => (
            <Tab
              key={stage.id}
              value={stage.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {stage.icon}
                  {stage.label}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Workflow Component */}
      <Box>{renderWorkflowComponent()}</Box>
    </GridContainer>
  );
};