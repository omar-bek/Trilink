import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  Calculate,
  AttachMoney,
  Receipt,
  Info,
} from '@mui/icons-material';

interface TaxBreakdown {
  label: string;
  amount: number;
  percentage: number;
}

interface EstimationResult {
  totalValue: number;
  duty: number;
  vat: number;
  otherTaxes: number;
  totalTaxes: number;
  finalAmount: number;
  breakdown: TaxBreakdown[];
}

export const DutyTaxEstimator = () => {
  const [productValue, setProductValue] = useState<number>(0);
  const [hsCode, setHsCode] = useState<string>('');
  const [dutyRate, setDutyRate] = useState<number>(5);
  const [vatRate, setVatRate] = useState<number>(14);
  const [result, setResult] = useState<EstimationResult | null>(null);

  const calculateTaxes = () => {
    if (!productValue || productValue <= 0) return;

    const duty = (productValue * dutyRate) / 100;
    const valueAfterDuty = productValue + duty;
    const vat = (valueAfterDuty * vatRate) / 100;
    const otherTaxes = productValue * 0.01; // 1% other fees
    const totalTaxes = duty + vat + otherTaxes;
    const finalAmount = productValue + totalTaxes;

    const breakdown: TaxBreakdown[] = [
      {
        label: 'Customs Duty',
        amount: duty,
        percentage: dutyRate,
      },
      {
        label: 'VAT',
        amount: vat,
        percentage: vatRate,
      },
      {
        label: 'Other Fees',
        amount: otherTaxes,
        percentage: 1,
      },
    ];

    setResult({
      totalValue: productValue,
      duty,
      vat,
      otherTaxes,
      totalTaxes,
      finalAmount,
      breakdown,
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 1 }}>
          Duty & Tax Estimator
        </Typography>
        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
          Calculate estimated customs duties and taxes for your imports
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1E293B' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 3 }}>
                Enter Product Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Product Value (USD)"
                  type="number"
                  value={productValue || ''}
                  onChange={(e) => setProductValue(parseFloat(e.target.value) || 0)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0F172A',
                      color: '#F1F5F9',
                      '& fieldset': {
                        borderColor: 'rgba(135, 206, 235, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#87CEEB',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4682B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#CBD5E1',
                      '&.Mui-focused': {
                        color: '#87CEEB',
                      },
                    },
                  }}
                />

                <TextField
                  label="HS Code"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  fullWidth
                  placeholder="e.g., 8517.12.00"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0F172A',
                      color: '#F1F5F9',
                      '& fieldset': {
                        borderColor: 'rgba(135, 206, 235, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#87CEEB',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4682B4',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#CBD5E1',
                      '&.Mui-focused': {
                        color: '#87CEEB',
                      },
                    },
                  }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Duty Rate (%)"
                      type="number"
                      value={dutyRate}
                      onChange={(e) => setDutyRate(parseFloat(e.target.value) || 0)}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0F172A',
                          color: '#F1F5F9',
                          '& fieldset': {
                            borderColor: 'rgba(135, 206, 235, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#87CEEB',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#4682B4',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#CBD5E1',
                          '&.Mui-focused': {
                            color: '#87CEEB',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="VAT Rate (%)"
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0F172A',
                          color: '#F1F5F9',
                          '& fieldset': {
                            borderColor: 'rgba(135, 206, 235, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#87CEEB',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#4682B4',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#CBD5E1',
                          '&.Mui-focused': {
                            color: '#87CEEB',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Calculate />}
                  onClick={calculateTaxes}
                  disabled={!productValue || productValue <= 0}
                  sx={{
                    backgroundColor: '#4682B4',
                    '&:hover': { backgroundColor: '#2563EB' },
                    py: 1.5,
                  }}
                >
                  Calculate
                </Button>

                <Alert severity="info" sx={{ backgroundColor: 'rgba(70, 130, 180, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                    <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Rates are estimates. Final amounts may vary based on customs assessment.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          {result ? (
            <Card sx={{ backgroundColor: '#1E293B' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 3 }}>
                  Estimated Breakdown
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                      Product Value
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                      ${result.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(135, 206, 235, 0.1)', my: 1 }} />

                  <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#CBD5E1', fontWeight: 600 }}>Tax Type</TableCell>
                          <TableCell align="right" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                            Rate
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                            Amount
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.breakdown.map((item) => (
                          <TableRow key={item.label}>
                            <TableCell sx={{ color: '#F1F5F9' }}>{item.label}</TableCell>
                            <TableCell align="right" sx={{ color: '#CBD5E1' }}>
                              {item.percentage}%
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#F1F5F9', fontWeight: 500 }}>
                              ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ borderColor: 'rgba(135, 206, 235, 0.1)', my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                      Total Taxes
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                      ${result.totalTaxes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      backgroundColor: 'rgba(70, 130, 180, 0.1)',
                      borderRadius: 1,
                      border: '1px solid rgba(70, 130, 180, 0.3)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt sx={{ color: '#87CEEB' }} />
                        <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                          Final Amount
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ color: '#87CEEB', fontWeight: 700 }}>
                        ${result.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ backgroundColor: '#1E293B' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Calculate sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#CBD5E1' }}>
                    Enter product details and click Calculate to see estimated taxes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
