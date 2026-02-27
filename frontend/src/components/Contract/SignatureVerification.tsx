/**
 * Signature Verification Component
 * Displays and verifies contract signatures with certificate information
 * Provides legal audit trail visibility
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ExpandMore,
  VerifiedUser,
  Security,
} from '@mui/icons-material';
import { Contract } from '@/types/contract';
import api from '@/services/api';

interface SignatureVerificationProps {
  contract: Contract;
}

interface VerificationResult {
  valid: boolean;
  error?: string;
  certificateInfo?: {
    subject: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    fingerprint: string;
  };
}

export const SignatureVerification = ({ contract }: SignatureVerificationProps) => {
  const [verificationResults, setVerificationResults] = useState<
    Record<string, VerificationResult>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const verifySignature = async (signatureId: string) => {
    setLoading((prev) => ({ ...prev, [signatureId]: true }));
    try {
      const response = await api.post<{
        success: boolean;
        data: VerificationResult;
      }>(`/contracts/${contract._id || contract.id}/verify-signature`, {
        signatureId,
      });

      setVerificationResults((prev) => ({
        ...prev,
        [signatureId]: response.data.data,
      }));
    } catch (error: any) {
      setVerificationResults((prev) => ({
        ...prev,
        [signatureId]: {
          valid: false,
          error:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            'Verification failed',
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [signatureId]: false }));
    }
  };

  if (!contract.signatures || contract.signatures.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">No signatures found on this contract.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Security color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Signature Verification
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Verify the cryptographic signatures on this contract. Each signature
          includes a digital certificate for legal validity.
        </Typography>

        {contract.signatures.map((signature, index) => {
          const signatureId = (signature as any)._id || `sig-${index}`;
          const result = verificationResults[signatureId];
          const isValid = result?.valid === true;
          const isVerified = signature.verified === true;

          return (
            <Accordion key={signatureId} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                  }}
                >
                  {isValid || isVerified ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="error" />
                  )}
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    Signature #{index + 1} - Party {signature.partyId}
                  </Typography>
                  <Chip
                    label={isValid || isVerified ? 'Verified' : 'Unverified'}
                    color={isValid || isVerified ? 'success' : 'warning'}
                    size="small"
                    icon={isValid || isVerified ? <VerifiedUser /> : undefined}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Signed At:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {new Date(signature.signedAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Algorithm:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {signature.algorithm || 'Unknown'}
                    </Typography>
                  </Box>

                  {signature.certificate && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Certificate:</strong>
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          p: 1.5,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          maxHeight: 200,
                          fontFamily: 'monospace',
                        }}
                      >
                        {signature.certificate.length > 300
                          ? `${signature.certificate.substring(0, 300)}...`
                          : signature.certificate}
                      </Box>
                    </Box>
                  )}

                  {signature.signatureHash && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Signature Hash (SHA-256):</strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          bgcolor: 'grey.50',
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {signature.signatureHash}
                      </Typography>
                    </Box>
                  )}

                  {result && (
                    <Alert
                      severity={result.valid ? 'success' : 'error'}
                      icon={result.valid ? <CheckCircle /> : <Cancel />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {result.valid
                          ? 'Signature is valid and verified.'
                          : `Verification failed: ${result.error || 'Unknown error'}`}
                      </Typography>
                      {result.certificateInfo && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            <strong>Subject:</strong> {result.certificateInfo.subject}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>Issuer:</strong> {result.certificateInfo.issuer}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>Valid From:</strong>{' '}
                            {new Date(result.certificateInfo.validFrom).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>Valid To:</strong>{' '}
                            {new Date(result.certificateInfo.validTo).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>Fingerprint:</strong> {result.certificateInfo.fingerprint}
                          </Typography>
                        </Box>
                      )}
                    </Alert>
                  )}

                  {!result && (
                    <Button
                      variant="outlined"
                      onClick={() => verifySignature(signatureId)}
                      disabled={loading[signatureId]}
                      startIcon={
                        loading[signatureId] ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Security />
                        )
                      }
                    >
                      {loading[signatureId] ? 'Verifying...' : 'Verify Signature'}
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </CardContent>
    </Card>
  );
};
