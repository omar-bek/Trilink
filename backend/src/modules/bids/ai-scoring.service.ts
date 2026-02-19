/**
 * AI Scoring Service with Transparency & Governance
 * 
 * This service provides AI-based bid scoring with full transparency:
 * - Detailed score breakdowns
 * - Confidence levels
 * - Risk assessments
 * - Explainable recommendations
 * 
 * Scoring Strategy:
 * - Price competitiveness (40%)
 * - Delivery time (30%)
 * - Terms quality (20%)
 * - Provider history (10%)
 */

export type RiskLevel = 'low' | 'medium' | 'high';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ScoringInput {
  price: number;
  deliveryTime: number;
  paymentTerms: string; // Payment terms and conditions
  rfqBudget: number;
  rfqDeadline: Date;
  providerId?: string; // Optional: for history lookup
  companyId?: string; // Optional: for history lookup
}

export interface ScoreBreakdown {
  price: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
  delivery: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
  terms: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
  history: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
}

export interface AIScoreResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  overallConfidence: ConfidenceLevel;
  overallRisk: RiskLevel;
  recommendation: string;
  timestamp: Date;
  modelVersion?: string;
}

export class AIScoringService {
  /**
   * Score a bid using AI/ML algorithms with full transparency
   * Returns detailed breakdown for explainability
   */
  async scoreBid(bidId: string, input: ScoringInput): Promise<AIScoreResult> {
    // Simulate async processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Calculate price score (lower is better, normalized to 0-40)
    const priceRatio = input.price / input.rfqBudget;
    const priceScore = Math.max(0, 40 * (1 - Math.min(priceRatio, 1.5) / 1.5));
    const priceConfidence: ConfidenceLevel = priceRatio <= 1.0 ? 'high' : priceRatio <= 1.2 ? 'medium' : 'low';
    const priceRisk: RiskLevel = priceRatio > 1.3 ? 'high' : priceRatio > 1.1 ? 'medium' : 'low';
    const priceExplanation = priceRatio <= 1.0
      ? `Price is ${((1 - priceRatio) * 100).toFixed(1)}% below budget. Excellent value.`
      : priceRatio <= 1.2
      ? `Price is ${((priceRatio - 1) * 100).toFixed(1)}% above budget. Good value.`
      : `Price is ${((priceRatio - 1) * 100).toFixed(1)}% above budget. Consider negotiation.`;

    // Calculate delivery time score (faster is better, normalized to 0-30)
    const daysUntilDeadline = Math.ceil(
      (input.rfqDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const deliveryRatio = input.deliveryTime / daysUntilDeadline;
    const deliveryScore = Math.max(0, 30 * (1 - Math.min(deliveryRatio, 1.5) / 1.5));
    const deliveryConfidence: ConfidenceLevel = deliveryRatio <= 0.8 ? 'high' : deliveryRatio <= 1.0 ? 'medium' : 'low';
    const deliveryRisk: RiskLevel = deliveryRatio > 1.2 ? 'high' : deliveryRatio > 1.0 ? 'medium' : 'low';
    const deliveryExplanation = deliveryRatio <= 0.8
      ? `Delivery time is ${((1 - deliveryRatio) * 100).toFixed(0)}% faster than deadline. Excellent.`
      : deliveryRatio <= 1.0
      ? `Delivery time meets deadline. Reliable.`
      : `Delivery time is ${((deliveryRatio - 1) * 100).toFixed(0)}% longer than deadline. Risk of delay.`;

    // Calculate payment terms quality score (normalized to 0-20)
    const termsLength = input.paymentTerms.length;
    const termsScore = Math.min(20, (termsLength / 500) * 20);
    const termsConfidence: ConfidenceLevel = termsLength >= 300 ? 'high' : termsLength >= 150 ? 'medium' : 'low';
    const termsRisk: RiskLevel = termsLength < 100 ? 'high' : termsLength < 200 ? 'medium' : 'low';
    const termsExplanation = termsLength >= 300
      ? `Comprehensive payment terms (${termsLength} chars). Well-defined.`
      : termsLength >= 150
      ? `Moderate payment terms (${termsLength} chars). Adequate detail.`
      : `Brief payment terms (${termsLength} chars). May need clarification.`;

    // Provider history score (placeholder, normalized to 0-10)
    // In production, this would query actual provider performance history
    const historyScore = 5; // Placeholder
    const historyConfidence: ConfidenceLevel = 'low'; // Limited data available
    const historyRisk: RiskLevel = 'medium'; // Unknown history
    const historyExplanation = 'Provider history data limited. Score based on default assessment.';

    // Calculate total score
    const totalScore = Math.round(priceScore + deliveryScore + termsScore + historyScore);
    const finalScore = Math.min(100, Math.max(0, totalScore));

    // Calculate overall confidence (weighted average)
    const confidenceScores = {
      high: 3,
      medium: 2,
      low: 1,
    };
    const avgConfidence = (
      confidenceScores[priceConfidence] * 0.4 +
      confidenceScores[deliveryConfidence] * 0.3 +
      confidenceScores[termsConfidence] * 0.2 +
      confidenceScores[historyConfidence] * 0.1
    );
    const overallConfidence: ConfidenceLevel = avgConfidence >= 2.5 ? 'high' : avgConfidence >= 1.8 ? 'medium' : 'low';

    // Calculate overall risk (worst case)
    const riskScores = { low: 1, medium: 2, high: 3 };
    const maxRisk = Math.max(
      riskScores[priceRisk],
      riskScores[deliveryRisk],
      riskScores[termsRisk],
      riskScores[historyRisk]
    );
    const overallRisk: RiskLevel = maxRisk >= 3 ? 'high' : maxRisk >= 2 ? 'medium' : 'low';

    // Generate recommendation
    let recommendation = '';
    if (finalScore >= 80) {
      recommendation = 'Strong recommendation. This bid offers excellent value with competitive pricing and reliable delivery.';
    } else if (finalScore >= 60) {
      recommendation = 'Good recommendation. This bid is competitive but review terms carefully.';
    } else {
      recommendation = 'Caution recommended. Review pricing, delivery timeline, and terms before proceeding.';
    }

    return {
      totalScore: finalScore,
      breakdown: {
        price: {
          score: Math.round(priceScore),
          maxScore: 40,
          weight: 0.4,
          explanation: priceExplanation,
          confidence: priceConfidence,
          risk: priceRisk,
        },
        delivery: {
          score: Math.round(deliveryScore),
          maxScore: 30,
          weight: 0.3,
          explanation: deliveryExplanation,
          confidence: deliveryConfidence,
          risk: deliveryRisk,
        },
        terms: {
          score: Math.round(termsScore),
          maxScore: 20,
          weight: 0.2,
          explanation: termsExplanation,
          confidence: termsConfidence,
          risk: termsRisk,
        },
        history: {
          score: Math.round(historyScore),
          maxScore: 10,
          weight: 0.1,
          explanation: historyExplanation,
          confidence: historyConfidence,
          risk: historyRisk,
        },
      },
      overallConfidence,
      overallRisk,
      recommendation,
      timestamp: new Date(),
      modelVersion: '1.0.0',
    };
  }

  /**
   * Get simple score (backward compatibility)
   */
  async getSimpleScore(bidId: string, input: ScoringInput): Promise<number> {
    const result = await this.scoreBid(bidId, input);
    return result.totalScore;
  }

  /**
   * Batch score multiple bids
   */
  async scoreBids(
    bids: Array<{ bidId: string; input: ScoringInput }>
  ): Promise<Array<{ bidId: string; score: number; result: AIScoreResult }>> {
    const scores = await Promise.all(
      bids.map(async (bid) => {
        const result = await this.scoreBid(bid.bidId, bid.input);
        return {
          bidId: bid.bidId,
          score: result.totalScore,
          result,
        };
      })
    );
    return scores;
  }
}
