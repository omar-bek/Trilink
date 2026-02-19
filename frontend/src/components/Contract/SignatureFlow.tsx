import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, CheckCircle } from '@mui/icons-material';
import { Contract, ContractStatus } from '@/types/contract';
import { useSignContract } from '@/hooks/useContracts';
import { useAuthStore } from '@/store/auth.store';
import { getCryptoService } from '@/services/crypto.service';

interface SignatureFlowProps {
  contract: Contract;
}

export const SignatureFlow = ({ contract }: SignatureFlowProps) => {
  const { user } = useAuthStore();
  const signMutation = useSignContract();
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [confirmRead, setConfirmRead] = useState(false);
  const [confirmAgree, setConfirmAgree] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [signingError, setSigningError] = useState<string | null>(null);

  const currentUserCompanyId = user?.companyId;
  const currentUserParty = contract.parties.find((p) => p.companyId === currentUserCompanyId);
  const hasSigned = contract.signatures.some((sig) => sig.partyId === currentUserCompanyId);
  const canSign =
    contract.status === ContractStatus.PENDING_SIGNATURES &&
    currentUserParty &&
    !hasSigned;

  const handleOpenSignatureDialog = () => {
    setSignatureDialogOpen(true);
    // Pre-fill with user's name as signature
    setSignatureText(`${user?.firstName} ${user?.lastName}`);
  };

  const handleSign = async () => {
    if (!signatureText.trim() || !confirmRead || !confirmAgree) {
      return;
    }

    const contractId = contract._id || contract.id;
    if (!contractId) {
      console.error('Contract ID is missing');
      return;
    }

    if (!user?.id) {
      setSigningError('User information not available');
      return;
    }

    setSigningInProgress(true);
    setSigningError(null);

    try {
      // Initialize crypto service
      const cryptoService = getCryptoService();
      await cryptoService.initializeKeys(user.id);

      // Prepare contract content for signing
      const contractContent = JSON.stringify({
        contractId,
        version: contract.version || 1,
        terms: contract.terms,
        amounts: contract.amounts,
        parties: contract.parties.map((p) => ({
          companyId: p.companyId,
          userId: p.userId,
          role: p.role,
        })),
        timestamp: new Date().toISOString(),
      });

      // Generate cryptographically secure signature
      const signingResult = await cryptoService.sign(contractContent);

      // Send to backend
      signMutation.mutate(
        {
          id: contractId,
          data: {
            signature: signingResult.signature,
            certificate: signingResult.certificate,
            algorithm: signingResult.algorithm,
            timestamp: signingResult.timestamp,
          },
        },
        {
          onSuccess: (data) => {
            setSignatureDialogOpen(false);
            setSignatureText('');
            setConfirmRead(false);
            setConfirmAgree(false);
            setSigningInProgress(false);
            
            // Check if all parties have signed
            const updatedContract = data?.data;
            if (updatedContract && updatedContract.signatures?.length === updatedContract.parties?.length) {
              // All parties signed - contract will be auto-activated
              // The parent component will show next steps
            }
          },
          onError: (error: any) => {
            setSigningInProgress(false);
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to sign contract';
            setSigningError(errorMessage);
            console.error('Sign contract error:', error);
          },
        }
      );
    } catch (error: any) {
      setSigningInProgress(false);
      const errorMessage = error?.message || 'Failed to generate cryptographic signature';
      setSigningError(errorMessage);
      console.error('Cryptographic signing failed:', error);
    }
  };

  if (!currentUserParty) {
    return null; // User is not a party to this contract
  }

  if (hasSigned) {
    const signature = contract.signatures.find((sig) => sig.partyId === currentUserCompanyId);
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Contract Signed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You signed this contract on {signature && new Date(signature.signedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!canSign) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            {contract.status === ContractStatus.SIGNED
              ? 'All parties have signed this contract.'
              : 'Waiting for other parties to sign.'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Digital Signature
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review the contract terms carefully. By signing, you agree to the terms and conditions.
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleOpenSignatureDialog}
            fullWidth
            size="large"
          >
            Sign Contract
          </Button>
        </CardContent>
      </Card>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onClose={() => setSignatureDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sign Contract</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Please review the contract terms and provide your digital signature.
          </DialogContentText>

          <TextField
            fullWidth
            label="Signature"
            placeholder="Enter your full name"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={confirmRead}
                onChange={(e) => setConfirmRead(e.target.checked)}
              />
            }
            label="I have read and understood the contract terms"
            sx={{ mb: 1 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={confirmAgree}
                onChange={(e) => setConfirmAgree(e.target.checked)}
              />
            }
            label="I agree to the terms and conditions"
            sx={{ mb: 2 }}
          />

          {(signMutation.isError || signingError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {signingError || signMutation.error?.response?.data?.error || signMutation.error?.response?.data?.message || 'Failed to sign contract'}
              </Typography>
              {signMutation.error?.response?.data?.errors && (
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {signMutation.error.response.data.errors.map((err: any, idx: number) => (
                    <li key={idx}>
                      <Typography variant="body2">
                        {err.field || err.path?.join('.')}: {err.message}
                      </Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSign}
            variant="contained"
            disabled={!signatureText.trim() || !confirmRead || !confirmAgree || signMutation.isPending || signingInProgress}
            startIcon={signMutation.isPending || signingInProgress ? <CircularProgress size={16} /> : null}
          >
            {signMutation.isPending || signingInProgress ? 'Signing...' : 'Sign Contract'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
