import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { Contract, ContractSignature } from '@/types/contract';
import { useAuthStore } from '@/store/auth.store';

interface PartiesOverviewProps {
  contract: Contract;
}

export const PartiesOverview = ({ contract }: PartiesOverviewProps) => {
  const { user } = useAuthStore();
  const currentUserCompanyId = user?.companyId;

  const isSigned = (partyId: string): boolean => {
    return contract.signatures.some((sig) => sig.partyId === partyId);
  };

  const getSignature = (partyId: string): ContractSignature | undefined => {
    return contract.signatures.find((sig) => sig.partyId === partyId);
  };

  const getPartyAmount = (partyId: string): number => {
    const breakdown = contract.amounts.breakdown.find((b) => b.partyId === partyId);
    return breakdown?.amount || 0;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Contract Parties
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {contract.parties.map((party, index) => {
            const signed = isSigned(party.companyId);
            const signature = getSignature(party.companyId);
            const isCurrentUserParty = party.companyId === currentUserCompanyId;
            const amount = getPartyAmount(party.companyId);

            return (
              <Box key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: signed ? 'success.main' : 'grey.400' }}>
                    {party.role[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {party.role}
                      </Typography>
                      {isCurrentUserParty && (
                        <Chip label="You" size="small" color="primary" />
                      )}
                      {signed ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUnchecked color="disabled" fontSize="small" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Company ID: {party.companyId.slice(-8)}
                    </Typography>
                    {amount > 0 && (
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                        Amount: {amount.toLocaleString()} {contract.amounts.currency}
                      </Typography>
                    )}
                    {signature && (
                      <Typography variant="caption" color="text.secondary">
                        Signed: {new Date(signature.signedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={signed ? 'Signed' : 'Pending'}
                    color={signed ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                {index < contract.parties.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
