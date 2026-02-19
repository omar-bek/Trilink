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
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Close, Add, Remove, Edit } from '@mui/icons-material';
import { VersionDiff as VersionDiffType } from '@/types/contract';
import { formatCurrency, formatDate } from '@/utils';

interface VersionDiffProps {
  diff: VersionDiffType | null;
  open: boolean;
  onClose: () => void;
}

export const VersionDiff = ({ diff, open, onClose }: VersionDiffProps) => {
  if (!diff) return null;

  const renderDiffValue = (field: string, oldValue: any, newValue: any) => {
    if (oldValue === null) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <Add fontSize="small" />
          <Typography variant="body2" component="span">
            {formatValue(field, newValue)}
          </Typography>
        </Box>
      );
    }
    if (newValue === null) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <Remove fontSize="small" />
          <Typography variant="body2" component="span">
            {formatValue(field, oldValue)}
          </Typography>
        </Box>
      );
    }
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', mb: 0.5 }}>
          <Remove fontSize="small" />
          <Typography variant="body2" component="span">
            {formatValue(field, oldValue)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <Add fontSize="small" />
          <Typography variant="body2" component="span">
            {formatValue(field, newValue)}
          </Typography>
        </Box>
      </Box>
    );
  };

  const formatValue = (field: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (field.includes('Date') || field.includes('date')) {
      try {
        return formatDate(value);
      } catch {
        return String(value);
      }
    }
    if (field.includes('amount') || field.includes('total') || field.includes('Amount') || field.includes('Total')) {
      try {
        const currency = diff.version1.snapshot.amounts.currency || diff.version2.snapshot.amounts.currency || 'AED';
        return formatCurrency(Number(value), currency);
      } catch {
        return String(value);
      }
    }
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const renderFieldDiff = (difference: typeof diff.differences[0]) => {
    return (
      <Card key={difference.path} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Edit fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {difference.field.replace(/\./g, ' ')}
              </Typography>
            </Box>
            <Divider />
            {renderDiffValue(difference.field, difference.oldValue, difference.newValue)}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Version Comparison: v{diff.version1.version} vs v{diff.version2.version}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Version Info */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Version {diff.version1.version}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created {new Date(diff.version1.createdAt).toLocaleDateString()}
                  </Typography>
                  {diff.version1.reason && (
                    <Chip label={diff.version1.reason} size="small" sx={{ mt: 1 }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Version {diff.version2.version}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created {new Date(diff.version2.createdAt).toLocaleDateString()}
                  </Typography>
                  {diff.version2.reason && (
                    <Chip label={diff.version2.reason} size="small" sx={{ mt: 1 }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Differences Summary */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Changes ({diff.differences.length})
              </Typography>
              {diff.differences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No differences found between these versions.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {diff.differences.map((difference) => renderFieldDiff(difference))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Side-by-side comparison for complex fields */}
          {diff.differences.some((d) => d.field.includes('terms')) && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Version {diff.version1.version} - Terms
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light', opacity: 0.1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {diff.version1.snapshot.terms || 'No terms'}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Version {diff.version2.version} - Terms
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', opacity: 0.1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {diff.version2.snapshot.terms || 'No terms'}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Payment Schedule Comparison */}
          {diff.differences.some((d) => d.field.includes('paymentSchedule')) && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Version {diff.version1.version} - Payment Schedule
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Milestone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {diff.version1.snapshot.paymentSchedule.map((milestone, index) => (
                            <TableRow key={index}>
                              <TableCell>{milestone.milestone}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(milestone.amount, diff.version1.snapshot.amounts.currency)}
                              </TableCell>
                              <TableCell>{formatDate(milestone.dueDate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Version {diff.version2.version} - Payment Schedule
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Milestone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {diff.version2.snapshot.paymentSchedule.map((milestone, index) => (
                            <TableRow key={index}>
                              <TableCell>{milestone.milestone}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(milestone.amount, diff.version2.snapshot.amounts.currency)}
                              </TableCell>
                              <TableCell>{formatDate(milestone.dueDate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
