/**
 * Bid Helper Utilities
 * 
 * Type conversion helpers for bid data, especially for AI score metadata
 */

import type { ConfidenceLevel } from '@/components/Bid/ConfidenceIndicator';
import type { RiskLevel } from '@/components/Bid/RiskBadge';
import type { ScoreBreakdown } from '@/components/Bid/AIScoreBreakdown';
import type { Bid } from '@/types/bid';

/**
 * Converts a string confidence level to ConfidenceLevel type
 */
export function toConfidenceLevel(confidence: string): ConfidenceLevel {
  if (confidence === 'high' || confidence === 'medium' || confidence === 'low') {
    return confidence;
  }
  // Default fallback
  return 'medium';
}

/**
 * Converts a string risk level to RiskLevel type
 */
export function toRiskLevel(risk: string): RiskLevel {
  if (risk === 'low' || risk === 'medium' || risk === 'high') {
    return risk;
  }
  // Default fallback
  return 'medium';
}

/**
 * Converts bid AI score metadata breakdown from API format (strings) to component format (typed)
 */
export function convertBreakdown(
  breakdown: Bid['aiScoreMetadata'] extends { breakdown: infer B } ? B : never
): ScoreBreakdown {
  return {
    price: {
      ...breakdown.price,
      confidence: toConfidenceLevel(breakdown.price.confidence),
      risk: toRiskLevel(breakdown.price.risk),
    },
    delivery: {
      ...breakdown.delivery,
      confidence: toConfidenceLevel(breakdown.delivery.confidence),
      risk: toRiskLevel(breakdown.delivery.risk),
    },
    terms: {
      ...breakdown.terms,
      confidence: toConfidenceLevel(breakdown.terms.confidence),
      risk: toRiskLevel(breakdown.terms.risk),
    },
    history: {
      ...breakdown.history,
      confidence: toConfidenceLevel(breakdown.history.confidence),
      risk: toRiskLevel(breakdown.history.risk),
    },
  };
}

/**
 * Normalizes AI metadata for component consumption
 * Alias for convertAIScoreMetadata for backward compatibility
 */
export function normalizeAiMetadata(
  metadata: Bid['aiScoreMetadata']
): {
  totalScore: number;
  breakdown: ScoreBreakdown;
  overallConfidence: ConfidenceLevel;
  overallRisk: RiskLevel;
  recommendation: string;
  timestamp?: Date;
  modelVersion?: string;
} | undefined {
  return convertAIScoreMetadata(metadata);
}

/**
 * Converts bid AI score metadata to component format
 */
export function convertAIScoreMetadata(
  metadata: Bid['aiScoreMetadata']
): {
  totalScore: number;
  breakdown: ScoreBreakdown;
  overallConfidence: ConfidenceLevel;
  overallRisk: RiskLevel;
  recommendation: string;
  timestamp?: Date;
  modelVersion?: string;
} | undefined {
  if (!metadata) return undefined;

  return {
    totalScore: metadata.totalScore,
    breakdown: convertBreakdown(metadata.breakdown),
    overallConfidence: toConfidenceLevel(metadata.overallConfidence),
    overallRisk: toRiskLevel(metadata.overallRisk),
    recommendation: metadata.recommendation,
    timestamp: metadata.timestamp ? new Date(metadata.timestamp) : undefined,
    modelVersion: metadata.modelVersion,
  };
}
