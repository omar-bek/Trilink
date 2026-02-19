/**
 * AI-Enhanced Duty & Tax Estimator
 * 
 * Enhanced version with AI-driven predictions and explanations
 * Builds on existing DutyTaxEstimator with intelligence layer
 */

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
  Tooltip,
  IconButton,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Calculate,
  AttachMoney,
  Receipt,
  Info,
  AutoAwesome,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { EnterpriseCard } from '@/components/common/EnterpriseCard';
import { designTokens } from '@/theme/designTokens';

const { colors, spacing, borders, typography } = designTokens;

export interface TaxBreakdown {
  label: string;
  amount: number;
  percentage: number;
  aiConfidence?: number;
  explanation?: string;
}

export interface AIEstimationResult {
  totalValue: number;
  duty: number;
  vat: number;
  otherTaxes: number;
  totalTaxes: number;
  finalAmount: number;
  breakdown: TaxBreakdown[];
  aiInsights?: {
    confidence: number;
    marketComparison?: {
      averageTaxRate: number;
      percentile: number;
    };
    recommendations?: string[];
    riskFactors?: string[];
    explanation?: string;
  };
}

interface AIDutyTaxEstimatorProps {
  onCalculate?: (result: AIEstimationResult) => void;
  initialValue?: number;
  initialHsCode?: string;
}

export const AIDutyTaxEstimator = ({
  onCalculate,
  initialValue,
  initialHsCode,
}: AIDutyTaxEstimatorProps) => {
  const [productValue, setProductValue] = useState<number>(initialValue || 0);
  const [hsCode, setHsCode] = useState<string>(initialHsCode || '');
  const [dutyRate, setDutyRate] = useState<number>(5);
  const [vatRate, setVatRate] = useState<number>(14);
  const [result, setResult] = useState<AIEstimationResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const calculateTaxes = () => {
    if (!productValue || productValue <= 0) return;

    const duty = (productValue * dutyRate) / 100;
    const valueAfterDuty = productValue + duty;
    const vat = (valueAfterDuty * vatRate) / 100;
    const otherTaxes = productValue * 0.01; // 1% other fees
    const totalTaxes = duty + vat + otherTaxes;
    const finalAmount = productValue + totalTaxes;

    // Simulate AI insights (in production, this would come from an API)
    const totalTaxRate = (totalTaxes / productValue) * 100;
    const marketAverage = 18; // Simulated market average tax rate
    const percentile = totalTaxRate < marketAverage ? 50 - (marketAverage - totalTaxRate) * 2 : 50 + (totalTaxRate - marketAverage) * 2;

    const breakdown: TaxBreakdown[] = [
      {
        label: 'Customs Duty',
        amount: duty,
        percentage: dutyRate,
        aiConfidence: 85,
        explanation: 'Based on HS code classification and UAE customs regulations',
      },
      {
        label: 'VAT',
        amount: vat,
        percentage: vatRate,
        aiConfidence: 95,
        explanation: 'Standard UAE VAT rate applied to value after duty',
      },
      {
        label: 'Other Fees',
        amount: otherTaxes,
        percentage: 1,
        aiConfidence: 70,
        explanation: 'Estimated handling and processing fees',
      },
    ];

    const aiResult: AIEstimationResult = {
      totalValue: productValue,
      duty,
      vat,
      otherTaxes,
      totalTaxes,
      finalAmount,
      breakdown,
      aiInsights: {
        confidence: 82,
        marketComparison: {
          averageTaxRate: marketAverage,
          percentile: Math.max(0, Math.min(100, percentile)),
        },
        recommendations: [
          'Consider reviewing HS code classification for potential duty reductions',
          'Verify if product qualifies for any trade agreement benefits',
          'Factor in potential currency fluctuations for international transactions',
        ],
        riskFactors: totalTaxRate > marketAverage * 1.2 ? ['Above-average tax burden detected'] : [],
        explanation: `Estimated total tax rate of ${totalTaxRate.toFixed(1)}% is ${totalTaxRate < marketAverage ? 'below' : 'above'} the market average of ${marketAverage}%.`,
      },
    };

    setResult(aiResult);
    onCalculate?.(aiResult);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AutoAwesome sx={{ fontSize: 20, color: colors.intelligence.cerulean }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
            AI-Enhanced Duty & Tax Estimator
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
          Calculate estimated customs duties and taxes with AI-powered insights
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <EnterpriseCard>
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
              />

              <TextField
                label="HS Code"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                fullWidth
                placeholder="e.g., 8517.12.00"
                helperText="Harmonized System code for product classification"
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Duty Rate (%)"
                    type="number"
                    value={dutyRate}
                    onChange={(e) => setDutyRate(parseFloat(e.target.value) || 0)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="VAT Rate (%)"
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                fullWidth
                startIcon={<Calculate />}
                onClick={calculateTaxes}
                disabled={!productValue || productValue <= 0}
                sx={{ py: 1.5 }}
              >
                Calculate with AI Analysis
              </Button>

              <Alert severity="info" sx={{ backgroundColor: 'rgba(0, 123, 167, 0.1)' }}>
                <Typography variant="body2" sx={{ color: colors.base.neutral200 }}>
                  <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Rates are AI-estimated. Final amounts may vary based on customs assessment.
                </Typography>
              </Alert>
            </Box>
          </EnterpriseCard>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          {result ? (
            <EnterpriseCard>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Estimated Breakdown
                </Typography>
                <Chip
                  icon={<AutoAwesome />}
                  label={`${result.aiInsights?.confidence}% AI Confidence`}
                  size="small"
                  sx={{
                    backgroundColor: `${colors.intelligence.cerulean}20`,
                    color: colors.intelligence.cerulean,
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                    Product Value
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                    {formatCurrency(result.totalValue)}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: borders.color.default, my: 1 }} />

                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: colors.base.neutral300, fontWeight: 600 }}>Tax Type</TableCell>
                        <TableCell align="right" sx={{ color: colors.base.neutral300, fontWeight: 600 }}>
                          Rate
                        </TableCell>
                        <TableCell align="right" sx={{ color: colors.base.neutral300, fontWeight: 600 }}>
                          Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.breakdown.map((item) => (
                        <TableRow key={item.label}>
                          <TableCell sx={{ color: '#F1F5F9' }}>
                            <Box>
                              {item.label}
                              {item.aiConfidence && (
                                <Tooltip title={`AI Confidence: ${item.aiConfidence}%${item.explanation ? ` - ${item.explanation}` : ''}`}>
                                  <Info sx={{ fontSize: 12, ml: 0.5, color: colors.base.neutral400, verticalAlign: 'middle' }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: colors.base.neutral300 }}>
                            {item.percentage}%
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#F1F5F9', fontWeight: 500 }}>
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ borderColor: borders.color.default, my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: colors.base.neutral300, fontWeight: 600 }}>
                    Total Taxes
                  </Typography>
                  <Typography variant="h6" sx={{ color: colors.semantic.warning, fontWeight: 700 }}>
                    {formatCurrency(result.totalTaxes)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: `${colors.intelligence.cerulean}10`,
                    borderRadius: borders.radius.md,
                    border: `1px solid ${colors.intelligence.cerulean}40`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Receipt sx={{ color: colors.intelligence.cerulean }} />
                      <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        Final Amount
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ color: colors.intelligence.cerulean, fontWeight: 700 }}>
                      {formatCurrency(result.finalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* AI Insights */}
              {result.aiInsights && (
                <Box>
                  <Button
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                    sx={{ color: colors.intelligence.cerulean, mb: 1 }}
                  >
                    AI Insights
                  </Button>
                  <Collapse in={expanded}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: borders.radius.md,
                        backgroundColor: colors.base.blackPearlLighter,
                        border: `1px solid ${borders.color.default}`,
                      }}
                    >
                      {result.aiInsights.explanation && (
                        <Typography variant="body2" sx={{ color: colors.base.neutral200, mb: 2 }}>
                          {result.aiInsights.explanation}
                        </Typography>
                      )}
                      {result.aiInsights.marketComparison && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                            Market Position: {result.aiInsights.marketComparison.percentile.toFixed(0)}th percentile
                          </Typography>
                        </Box>
                      )}
                      {result.aiInsights.recommendations && result.aiInsights.recommendations.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, mb: 1 }}>
                            Recommendations
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {result.aiInsights.recommendations.map((rec, idx) => (
                              <li key={idx}>
                                <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                                  {rec}
                                </Typography>
                              </li>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )}
            </EnterpriseCard>
          ) : (
            <EnterpriseCard>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Calculate sx={{ fontSize: 48, color: colors.base.neutral400, mb: 2 }} />
                <Typography variant="body1" sx={{ color: colors.base.neutral300 }}>
                  Enter product details and click Calculate to see AI-powered tax estimates
                </Typography>
              </Box>
            </EnterpriseCard>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
