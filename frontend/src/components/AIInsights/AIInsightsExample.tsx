/**
 * AI Insights Components - Usage Examples
 * 
 * Comprehensive examples showing how to use all AI-driven components
 */

import { Grid, Box, Typography, Divider } from '@mui/material';
import {
  PriceBenchmarkingWidget,
  PriceBenchmark,
  RiskScoreMeter,
  RiskScore,
  DeliveryDelayPrediction,
  DeliveryPrediction,
  FraudAlert,
  FraudAlert as FraudAlertType,
  CarbonFootprintIndicator,
  CarbonFootprint,
  AIDutyTaxEstimator,
} from './index';
import { designTokens } from '@/theme/designTokens';

const { colors, spacing } = designTokens;

export const AIInsightsExample = () => {
  // Example data for Price Benchmarking
  const priceBenchmark: PriceBenchmark = {
    currentPrice: 15000,
    marketAverage: 14500,
    marketLow: 12000,
    marketHigh: 18000,
    percentile: 65,
    confidence: 87,
    dataPoints: 1247,
    lastUpdated: new Date(),
    explanation: 'Price compared against similar products in the same category over the past 6 months',
    recommendations: [
      'Consider negotiating for bulk discounts',
      'Market trend suggests prices may decrease next quarter',
      'Similar products available at 5-8% lower prices',
    ],
  };

  // Example data for Risk Score
  const riskScore: RiskScore = {
    overall: 45,
    level: 'medium',
    confidence: 82,
    lastUpdated: new Date(),
    context: 'Transaction shows moderate risk due to new supplier relationship',
    factors: [
      {
        name: 'Supplier History',
        score: 30,
        weight: 0.3,
        explanation: 'Supplier has limited transaction history (3 previous orders)',
        recommendation: 'Request additional documentation and references',
      },
      {
        name: 'Payment Terms',
        score: 60,
        weight: 0.4,
        explanation: 'Unusual payment terms requested (90 days vs standard 30)',
        recommendation: 'Negotiate standard payment terms or request advance payment',
      },
      {
        name: 'Geographic Risk',
        score: 25,
        weight: 0.2,
        explanation: 'Low risk region with stable trade relations',
      },
      {
        name: 'Documentation Quality',
        score: 55,
        weight: 0.1,
        explanation: 'Some documentation incomplete or unclear',
        recommendation: 'Request clarification on missing documents',
      },
    ],
  };

  // Example data for Delivery Prediction
  const deliveryPrediction: DeliveryPrediction = {
    estimatedDelivery: new Date('2024-12-15'),
    onTimeProbability: 75,
    delayProbability: 25,
    expectedDelayDays: 2,
    confidence: 88,
    lastUpdated: new Date(),
    route: {
      origin: 'Dubai, UAE',
      destination: 'London, UK',
      distance: 5500,
    },
    factors: [
      {
        name: 'Weather Conditions',
        impact: 'low',
        description: 'Mild weather expected along route with no major storms forecasted',
      },
      {
        name: 'Port Congestion',
        impact: 'medium',
        description: 'Moderate congestion at destination port (average wait time: 12 hours)',
        mitigation: 'Consider alternative port or earlier departure to avoid peak times',
      },
      {
        name: 'Customs Processing',
        impact: 'low',
        description: 'Standard processing time expected based on documentation quality',
      },
      {
        name: 'Carrier Performance',
        impact: 'low',
        description: 'Carrier has 92% on-time delivery rate for this route',
      },
    ],
  };

  // Example data for Fraud Alert (Medium)
  const fraudAlertMedium: FraudAlertType = {
    level: 'medium',
    score: 55,
    confidence: 79,
    timestamp: new Date(),
    actionable: true,
    transactionId: 'TXN-2024-001234',
    indicators: [
      {
        type: 'Unusual Payment Pattern',
        severity: 'medium',
        description: 'Payment amount significantly higher than historical average',
        evidence: ['3x average transaction size', 'New payment method used'],
        recommendation: 'Verify transaction with customer before processing',
      },
      {
        type: 'Account Activity',
        severity: 'low',
        description: 'Account shows increased activity in past 24 hours',
        evidence: ['5 transactions vs usual 1-2 per day'],
        recommendation: 'Monitor for additional unusual patterns',
      },
    ],
    actions: [
      {
        label: 'Review Transaction',
        onClick: () => console.log('Review transaction'),
        variant: 'contained',
      },
      {
        label: 'Contact Customer',
        onClick: () => console.log('Contact customer'),
        variant: 'outlined',
      },
    ],
  };

  // Example data for Fraud Alert (Critical)
  const fraudAlertCritical: FraudAlertType = {
    level: 'critical',
    score: 92,
    confidence: 95,
    timestamp: new Date(),
    actionable: true,
    transactionId: 'TXN-2024-001235',
    indicators: [
      {
        type: 'Suspicious Payment Source',
        severity: 'critical',
        description: 'Payment from flagged high-risk jurisdiction',
        evidence: ['Sanctioned country origin', 'Multiple failed verification attempts'],
        recommendation: 'Immediately halt transaction and escalate to security team',
      },
      {
        type: 'Identity Verification Failure',
        severity: 'critical',
        description: 'Multiple identity verification checks failed',
        evidence: ['Document mismatch', 'IP address anomaly'],
        recommendation: 'Require additional verification or block transaction',
      },
    ],
    actions: [
      {
        label: 'Block Transaction',
        onClick: () => console.log('Block transaction'),
        variant: 'contained',
      },
      {
        label: 'Escalate to Security',
        onClick: () => console.log('Escalate'),
        variant: 'contained',
      },
    ],
  };

  // Example data for Carbon Footprint
  const carbonFootprint: CarbonFootprint = {
    totalEmissions: 2450.5, // kg CO2e
    emissionsPerUnit: 12.25,
    unit: 'ton',
    confidence: 85,
    lastUpdated: new Date(),
    breakdown: [
      {
        category: 'Transportation',
        emissions: 1800,
        percentage: 73.5,
        description: 'Sea freight from origin to destination port',
      },
      {
        category: 'Packaging',
        emissions: 450,
        percentage: 18.4,
        description: 'Packaging materials and handling',
      },
      {
        category: 'Processing',
        emissions: 200.5,
        percentage: 8.1,
        description: 'Manufacturing and processing emissions',
      },
    ],
    comparison: {
      industryAverage: 2800,
      bestInClass: 1900,
      percentile: 35,
    },
    offsetCost: 49.00,
    recommendations: [
      'Consider sea freight optimization routes to reduce transportation emissions by 15%',
      'Switch to sustainable packaging materials to reduce packaging emissions by 30%',
      'Explore carbon offset programs for remaining emissions',
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1, color: '#FFFFFF', fontWeight: 700 }}>
        AI-Driven Insights Components
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: colors.base.neutral300 }}>
        Enterprise-grade AI components designed to be assistive, trustworthy, explainable, and non-intrusive
      </Typography>

      <Grid container spacing={3}>
        {/* Price Benchmarking */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2, borderColor: colors.base.neutral700 }}>
            <Typography variant="overline" sx={{ color: colors.base.neutral400 }}>
              Price Intelligence
            </Typography>
          </Divider>
        </Grid>
        <Grid item xs={12} md={6}>
          <PriceBenchmarkingWidget benchmark={priceBenchmark} />
        </Grid>

        {/* Risk Score */}
        <Grid item xs={12} md={6}>
          <RiskScoreMeter riskScore={riskScore} showFactors={true} />
        </Grid>

        {/* Delivery Prediction */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2, borderColor: colors.base.neutral700 }}>
            <Typography variant="overline" sx={{ color: colors.base.neutral400 }}>
              Logistics Intelligence
            </Typography>
          </Divider>
        </Grid>
        <Grid item xs={12}>
          <DeliveryDelayPrediction
            prediction={deliveryPrediction}
            scheduledDelivery={new Date('2024-12-13')}
          />
        </Grid>

        {/* Fraud Alerts */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2, borderColor: colors.base.neutral700 }}>
            <Typography variant="overline" sx={{ color: colors.base.neutral400 }}>
              Security & Fraud Detection
            </Typography>
          </Divider>
        </Grid>
        <Grid item xs={12} md={6}>
          <FraudAlert alert={fraudAlertMedium} dismissible={true} />
        </Grid>
        <Grid item xs={12} md={6}>
          <FraudAlert alert={fraudAlertCritical} dismissible={false} />
        </Grid>

        {/* Carbon Footprint */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2, borderColor: colors.base.neutral700 }}>
            <Typography variant="overline" sx={{ color: colors.base.neutral400 }}>
              Sustainability
            </Typography>
          </Divider>
        </Grid>
        <Grid item xs={12} md={6}>
          <CarbonFootprintIndicator footprint={carbonFootprint} showOffset={true} />
        </Grid>

        {/* AI Duty & Tax Estimator */}
        <Grid item xs={12} md={6}>
          <Divider sx={{ my: 2, borderColor: colors.base.neutral700 }}>
            <Typography variant="overline" sx={{ color: colors.base.neutral400 }}>
              Tax Intelligence
            </Typography>
          </Divider>
          <AIDutyTaxEstimator
            initialValue={10000}
            initialHsCode="8517.12.00"
            onCalculate={(result) => {
              console.log('AI Tax Estimation:', result);
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
