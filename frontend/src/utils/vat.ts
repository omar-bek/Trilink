/**
 * VAT Calculation Utilities
 * UAE Standard VAT Rate: 5%
 */

export const UAE_VAT_RATE = 0.05; // 5%

export interface VATBreakdown {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
}

/**
 * Calculate VAT breakdown from subtotal
 */
export function calculateVAT(
  subtotal: number,
  vatRate: number = UAE_VAT_RATE,
  currency: string = 'AED'
): VATBreakdown {
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency,
  };
}

/**
 * Calculate subtotal from total (reverse VAT calculation)
 */
export function calculateSubtotalFromTotal(
  total: number,
  vatRate: number = UAE_VAT_RATE
): number {
  return Math.round((total / (1 + vatRate)) * 100) / 100;
}

/**
 * Format VAT breakdown for display
 */
export function formatVATBreakdown(breakdown: VATBreakdown): string {
  return `${breakdown.currency} ${breakdown.subtotal.toFixed(2)} + ${breakdown.currency} ${breakdown.vatAmount.toFixed(2)} (VAT ${(breakdown.vatRate * 100).toFixed(0)}%) = ${breakdown.currency} ${breakdown.total.toFixed(2)}`;
}
