# AI-Driven UI Components

Enterprise-grade AI insights components designed to be **assistive, trustworthy, explainable, and non-intrusive**.

## Design Philosophy

All AI components follow these core principles:

1. **Assistive** - Provide helpful, contextual insights without overwhelming users
2. **Trustworthy** - Show confidence levels, data sources, and transparency indicators
3. **Explainable** - Always provide reasoning and breakdowns for AI decisions
4. **Non-intrusive** - Subtle, dismissible, and contextual - never blocking user workflows

## Components

### 1. Price Benchmarking Widget

AI-driven price comparison with market intelligence.

```tsx
import { PriceBenchmarkingWidget, PriceBenchmark } from '@/components/AIInsights';

const benchmark: PriceBenchmark = {
  currentPrice: 15000,
  marketAverage: 14500,
  marketLow: 12000,
  marketHigh: 18000,
  percentile: 65,
  confidence: 87,
  dataPoints: 1247,
  lastUpdated: new Date(),
  explanation: 'Price compared against similar products in the same category',
  recommendations: [
    'Consider negotiating for bulk discounts',
    'Market trend suggests prices may decrease next quarter',
  ],
};

<PriceBenchmarkingWidget benchmark={benchmark} currency="USD" />
```

**Features:**
- Visual percentile indicator showing where price sits in market range
- Confidence score and data point count
- Expandable explanations and recommendations
- Color-coded status (above/below/fair market rate)

### 2. Risk Score Meter

AI-driven risk assessment with explainable factors.

```tsx
import { RiskScoreMeter, RiskScore } from '@/components/AIInsights';

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
      explanation: 'Supplier has limited transaction history',
      recommendation: 'Request additional documentation',
    },
    {
      name: 'Payment Terms',
      score: 60,
      weight: 0.4,
      explanation: 'Unusual payment terms requested',
    },
  ],
};

<RiskScoreMeter riskScore={riskScore} showFactors={true} />
```

**Features:**
- Visual risk gauge with color-coded levels
- Weighted factor breakdown
- Individual factor explanations and recommendations
- Confidence indicator

### 3. Delivery Delay Prediction

AI-driven delivery timeline prediction with probability.

```tsx
import { DeliveryDelayPrediction, DeliveryPrediction } from '@/components/AIInsights';

const prediction: DeliveryPrediction = {
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
      description: 'Mild weather expected along route',
    },
    {
      name: 'Port Congestion',
      impact: 'medium',
      description: 'Moderate congestion at destination port',
      mitigation: 'Consider alternative port or earlier departure',
    },
  ],
};

<DeliveryDelayPrediction 
  prediction={prediction} 
  scheduledDelivery={new Date('2024-12-13')} 
/>
```

**Features:**
- On-time vs delay probability indicators
- Route information display
- Risk factor breakdown with mitigation suggestions
- Confidence scoring

### 4. Fraud Alert

AI-driven fraud detection alerts (non-intrusive for low/medium, prominent for high/critical).

```tsx
import { FraudAlert, FraudAlert as FraudAlertType } from '@/components/AIInsights';

const alert: FraudAlertType = {
  level: 'medium',
  score: 55,
  confidence: 79,
  timestamp: new Date(),
  actionable: true,
  indicators: [
    {
      type: 'Unusual Payment Pattern',
      severity: 'medium',
      description: 'Payment amount significantly higher than historical average',
      evidence: ['3x average transaction size', 'New payment method'],
      recommendation: 'Verify transaction with customer',
    },
  ],
  actions: [
    {
      label: 'Review Transaction',
      onClick: () => console.log('Review'),
      variant: 'contained',
    },
    {
      label: 'Dismiss',
      onClick: () => console.log('Dismiss'),
      variant: 'outlined',
    },
  ],
};

<FraudAlert 
  alert={alert} 
  dismissible={true}
  onAction={(action) => console.log(action)}
/>
```

**Features:**
- Adaptive display: card for low/medium, alert banner for high/critical
- Evidence-based indicators
- Actionable recommendations
- Dismissible for non-critical alerts

### 5. Carbon Footprint Indicator

AI-driven environmental impact visualization.

```tsx
import { CarbonFootprintIndicator, CarbonFootprint } from '@/components/AIInsights';

const footprint: CarbonFootprint = {
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
      description: 'Sea freight from origin to destination',
    },
    {
      category: 'Packaging',
      emissions: 450,
      percentage: 18.4,
    },
    {
      category: 'Processing',
      emissions: 200.5,
      percentage: 8.1,
    },
  ],
  comparison: {
    industryAverage: 2800,
    bestInClass: 1900,
    percentile: 35,
  },
  offsetCost: 49.00,
  recommendations: [
    'Consider sea freight optimization routes',
    'Switch to sustainable packaging materials',
  ],
};

<CarbonFootprintIndicator 
  footprint={footprint} 
  showOffset={true} 
/>
```

**Features:**
- Total emissions with per-unit breakdown
- Industry comparison and percentile ranking
- Offset cost estimation
- Reduction recommendations

### 6. AI-Enhanced Duty & Tax Estimator

Enhanced version of duty/tax calculator with AI insights.

```tsx
import { AIDutyTaxEstimator } from '@/components/AIInsights';

<AIDutyTaxEstimator 
  initialValue={10000}
  initialHsCode="8517.12.00"
  onCalculate={(result) => {
    console.log('Estimated taxes:', result.totalTaxes);
    console.log('AI insights:', result.aiInsights);
  }}
/>
```

**Features:**
- Standard tax calculation
- AI confidence scores per tax type
- Market comparison and percentile ranking
- Actionable recommendations
- Expandable AI insights panel

## Common Props

All components support:

- `compact?: boolean` - Compact display mode
- `onDismiss?: () => void` - Dismiss callback (where applicable)

## Styling

All components use the TriLink design system:
- Dark theme (Black Pearl base)
- Cerulean/Azure intelligence accents
- Enterprise-grade typography (Montserrat)
- Consistent spacing (4px grid)

## Best Practices

1. **Placement**: Use AI components contextually near relevant data
2. **Dismissibility**: Allow users to dismiss non-critical insights
3. **Confidence**: Always show confidence levels to build trust
4. **Explanations**: Provide expandable details for transparency
5. **Actions**: Include actionable recommendations when possible

## Integration Example

```tsx
import {
  PriceBenchmarkingWidget,
  RiskScoreMeter,
  DeliveryDelayPrediction,
  FraudAlert,
  CarbonFootprintIndicator,
} from '@/components/AIInsights';

function ContractDetailsPage({ contract }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <PriceBenchmarkingWidget benchmark={contract.priceBenchmark} />
      </Grid>
      <Grid item xs={12} md={6}>
        <RiskScoreMeter riskScore={contract.riskScore} />
      </Grid>
      <Grid item xs={12}>
        <DeliveryDelayPrediction prediction={contract.deliveryPrediction} />
      </Grid>
      {contract.fraudAlert && (
        <Grid item xs={12}>
          <FraudAlert alert={contract.fraudAlert} />
        </Grid>
      )}
      <Grid item xs={12}>
        <CarbonFootprintIndicator footprint={contract.carbonFootprint} />
      </Grid>
    </Grid>
  );
}
```

## Accessibility

All components follow WCAG 2.1 AA standards:
- Proper ARIA labels
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
- Focus indicators

## Future Enhancements

- Real-time data updates via WebSocket
- Customizable confidence thresholds
- Export insights as reports
- Historical trend visualization
- Multi-currency support
