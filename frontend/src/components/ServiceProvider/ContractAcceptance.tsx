/**
 * Contract Acceptance Component
 * 
 * Service provider contract review and acceptance interface
 */

import { useState } from 'react';
import { Box, Typography, Button, Alert, Divider, List, ListItem, ListItemText } from '@mui/material';
import { CheckCircle, Cancel, Description, Download } from '@mui/icons-material';
import { EnterpriseCard } from '@/components/common';
import { StatusBadge } from '@/components/common';
import { ServiceType, ServiceTypeConfig } from '@/config/serviceProvider';
import { designTokens } from '@/theme/designTokens';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractService } from '@/services/contract.service';
import { queryKeys } from '@/lib/queryKeys';

const { spacing } = designTokens;

interface ContractAcceptanceProps {
  serviceType: ServiceType;
  serviceConfig: ServiceTypeConfig;
  contractId?: string;
}

export const ContractAcceptance = ({
  serviceType,
  serviceConfig,
  contractId: propContractId,
}: ContractAcceptanceProps) => {
  const [accepted, setAccepted] = useState(false);
  const queryClient = useQueryClient();

  // Fetch contract data
  const { data: contractData, isLoading } = useQuery({
    queryKey: queryKeys.contracts.detail(propContractId || ''),
    queryFn: () => contractService.getContractById(propContractId || ''),
    enabled: !!propContractId && serviceConfig.workflow.hasContractAcceptance,
  });

  const contract = contractData?.data;

  const acceptMutation = useMutation({
    mutationFn: (id: string) => contractService.signContract(id, { signed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(propContractId || '') });
      setAccepted(true);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => contractService.updateContract(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(propContractId || '') });
    },
  });

  const handleAccept = () => {
    if (contract?._id) {
      acceptMutation.mutate(contract._id);
    }
  };

  const handleReject = () => {
    if (contract?._id) {
      rejectMutation.mutate(contract._id);
    }
  };

  if (!contract) {
    return (
      <EnterpriseCard title={`Contract Acceptance - ${serviceConfig.displayName}`}>
        <Alert severity="info">Please select a contract to review</Alert>
      </EnterpriseCard>
    );
  }

  return (
    <EnterpriseCard
      title={`Contract Acceptance - ${serviceConfig.displayName}`}
      subtitle={`Contract: ${contract.contractNumber || contract._id}`}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Contract Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Contract Status</Typography>
          <StatusBadge
            status={
              contract.status === 'accepted'
                ? 'success'
                : contract.status === 'rejected'
                ? 'error'
                : 'warning'
            }
            label={contract.status}
          />
        </Box>

        <Divider />

        {/* Contract Details */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Contract Details
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Contract Number"
                secondary={contract.contractNumber || 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Service Type"
                secondary={serviceConfig.displayName}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Total Value"
                secondary={`${contract.totalAmount || 0} ${contract.currency || 'AED'}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Start Date"
                secondary={contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="End Date"
                secondary={contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}
              />
            </ListItem>
          </List>
        </Box>

        <Divider />

        {/* Contract Terms */}
        {contract.terms && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Terms & Conditions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {contract.terms}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        {contract.status === 'pending' && !accepted && (
          <>
            <Divider />
            <Box sx={{ display: 'flex', gap: spacing.lg, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={handleReject}
                disabled={rejectMutation.isPending}
              >
                Reject Contract
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
              >
                Accept Contract
              </Button>
            </Box>
          </>
        )}

        {accepted && (
          <Alert severity="success">Contract accepted successfully!</Alert>
        )}

        {/* Download Contract */}
        <Box sx={{ display: 'flex', gap: spacing.md }}>
          <Button variant="outlined" startIcon={<Description />}>
            View Full Contract
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Download PDF
          </Button>
        </Box>
      </Box>
    </EnterpriseCard>
  );
};