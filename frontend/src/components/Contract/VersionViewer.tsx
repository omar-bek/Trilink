import {
  Box,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Close, CheckCircle, Schedule } from '@mui/icons-material';
import { ContractVersion } from '@/types/contract';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';

interface VersionViewerProps {
  version: ContractVersion | null;
  open: boolean;
  onClose: () => void;
}

export const VersionViewer = ({ version, open, onClose }: VersionViewerProps) => {
  if (!version) return null;

  const getSignatureStatus = () => {
    const signatureCount = version.signatures?.length || 0;
    const partyCount = version.snapshot.parties?.length || 0;
    
    if (signatureCount === 0) {
      return { label: 'No signatures', color: 'default' as const };
    }
    if (signatureCount === partyCount) {
      return { label: 'Fully signed', color: 'success' as const };
    }
    return { label: `Partially signed (${signatureCount}/${partyCount})`, color: 'warning' as const };
  };

  const signatureStatus = getSignatureStatus();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Version {version.version}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Version Info */}
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(version.createdAt)}
                  </Typography>
                </Box>
                {version.reason && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Reason
                    </Typography>
                    <Typography variant="body1">{version.reason}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Signature Status
                  </Typography>
                  <Chip
                    icon={<CheckCircle />}
                    label={signatureStatus.label}
                    size="small"
                    color={signatureStatus.color}
                  />
                </Box>
                {version.amendmentId && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Amendment
                    </Typography>
                    <Chip label="Created via Amendment" size="small" variant="outlined" />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Contract Terms */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Contract Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {version.snapshot.terms || 'No terms specified'}
              </Typography>
            </CardContent>
          </Card>

          {/* Amounts */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Financial Details
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(version.snapshot.amounts.total, version.snapshot.amounts.currency)}
                  </Typography>
                </Box>
                {version.snapshot.amounts.breakdown && version.snapshot.amounts.breakdown.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Amount Breakdown
                    </Typography>
                    {version.snapshot.amounts.breakdown.map((breakdown, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {breakdown.description}: {formatCurrency(breakdown.amount, version.snapshot.amounts.currency)}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          {version.snapshot.paymentSchedule && version.snapshot.paymentSchedule.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Payment Schedule
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Milestone</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {version.snapshot.paymentSchedule.map((milestone, index) => (
                        <TableRow key={index}>
                          <TableCell>{milestone.milestone}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(milestone.amount, version.snapshot.amounts.currency)}
                          </TableCell>
                          <TableCell>{formatDate(milestone.dueDate)}</TableCell>
                          <TableCell>
                            <Chip
                              label={milestone.status}
                              size="small"
                              color={
                                milestone.status === 'paid'
                                  ? 'success'
                                  : milestone.status === 'pending'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Contract Period
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Start Date
                  </Typography>
                  <Typography variant="body1">{formatDate(version.snapshot.startDate)}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    End Date
                  </Typography>
                  <Typography variant="body1">{formatDate(version.snapshot.endDate)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Signatures */}
          {version.signatures && version.signatures.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Signatures ({version.signatures.length})
                </Typography>
                <Stack spacing={1}>
                  {version.signatures.map((signature, index) => (
                    <Box key={index} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircle color="success" sx={{ fontSize: 20 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Signed on {formatDateTime(signature.signedAt)}
                          </Typography>
                          {signature.verified && (
                            <Chip
                              label="Verified"
                              size="small"
                              color="success"
                              sx={{ mt: 0.5, height: 20 }}
                            />
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
