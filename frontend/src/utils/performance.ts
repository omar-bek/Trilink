/**
 * Performance Monitoring & Acceptance Thresholds
 * 
 * Web Vitals tracking and performance acceptance criteria
 * 
 * Targets for 10x growth:
 * - FCP: < 1.0s
 * - LCP: < 2.5s
 * - FID: < 100ms
 * - CLS: < 0.1
 * - TTI: < 3.5s
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint
}

export interface PerformanceThresholds {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  inp: number;
}

// Performance acceptance thresholds for national-scale platform
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  fcp: 1000, // 1.0s - First Contentful Paint
  lcp: 2500, // 2.5s - Largest Contentful Paint
  fid: 100,  // 100ms - First Input Delay
  cls: 0.1,  // 0.1 - Cumulative Layout Shift
  ttfb: 600, // 600ms - Time to First Byte
  inp: 200,  // 200ms - Interaction to Next Paint
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    inp: null,
  };

  private listeners: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking() {
    // Track all Web Vitals
    onFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.notifyListeners();
      this.checkThreshold('fcp', metric.value);
    });

    onLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.notifyListeners();
      this.checkThreshold('lcp', metric.value);
    });

    // onFID removed in web-vitals v3, use onINP instead
    // onFID((metric) => {
    //   this.metrics.fid = metric.value;
    //   this.notifyListeners();
    //   this.checkThreshold('fid', metric.value);
    // });

    onCLS((metric) => {
      this.metrics.cls = metric.value;
      this.notifyListeners();
      this.checkThreshold('cls', metric.value);
    });

    onTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.notifyListeners();
      this.checkThreshold('ttfb', metric.value);
    });

    onINP((metric) => {
      this.metrics.inp = metric.value;
      this.notifyListeners();
      this.checkThreshold('inp', metric.value);
    });
  }

  private checkThreshold(metric: keyof PerformanceThresholds, value: number) {
    const threshold = PERFORMANCE_THRESHOLDS[metric];
    if (value > threshold) {
      console.warn(
        `Performance threshold exceeded: ${metric.toUpperCase()} = ${value.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
      
      // Send to monitoring service (e.g., Sentry, Analytics)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureMessage(
          `Performance threshold exceeded: ${metric}`,
          {
            level: 'warning',
            tags: { metric, value, threshold },
          }
        );
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.metrics));
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getPerformanceScore(): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    details: Record<string, { value: number; threshold: number; passed: boolean }>;
  } {
    const details: Record<string, { value: number; threshold: number; passed: boolean }> = {};
    let passedCount = 0;
    let totalCount = 0;

    Object.keys(PERFORMANCE_THRESHOLDS).forEach((key) => {
      const metricKey = key as keyof PerformanceMetrics;
      const value = this.metrics[metricKey];
      const threshold = PERFORMANCE_THRESHOLDS[metricKey as keyof PerformanceThresholds];

      if (value !== null) {
        const passed = value <= threshold;
        details[key] = { value, threshold, passed };
        if (passed) passedCount++;
        totalCount++;
      }
    });

    const score = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';

    if (score >= 90) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 50) grade = 'D';
    else grade = 'F';

    return { score, grade, details };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance metrics
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(
    performanceMonitor.getMetrics()
  );

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return unsubscribe;
  }, []);

  return {
    metrics,
    score: performanceMonitor.getPerformanceScore(),
  };
};

// Utility to measure function execution time
export const measurePerformance = <T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T => {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    const duration = end - start;

    if (duration > 16) {
      // Longer than one frame (16ms)
      console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }) as T;
};

// Utility to debounce with performance tracking
export const debounceWithPerformance = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  label: string
): T => {
  let timeoutId: NodeJS.Timeout;
  let callCount = 0;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    callCount++;

    timeoutId = setTimeout(() => {
      const start = performance.now();
      fn(...args);
      const duration = performance.now() - start;

      if (duration > 16) {
        console.warn(`[Performance] ${label} (debounced ${callCount}x) took ${duration.toFixed(2)}ms`);
      }

      callCount = 0;
    }, delay);
  }) as T;
};

// Check if device is low-end (for adaptive performance)
export const isLowEndDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // Check hardware concurrency
  const cores = navigator.hardwareConcurrency || 4;
  
  // Check memory (if available)
  const memory = (navigator as any).deviceMemory || 4;

  // Check connection (if available)
  const connection = (navigator as any).connection;
  const slowConnection = connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData
  );

  return cores <= 2 || memory <= 2 || slowConnection;
};

// Adaptive performance settings based on device
export const getAdaptivePerformanceSettings = () => {
  const isLowEnd = isLowEndDevice();

  return {
    enableVirtualization: !isLowEnd,
    enableAnimations: !isLowEnd,
    enableCharts: !isLowEnd,
    maxDataPoints: isLowEnd ? 100 : 1000,
    overscanCount: isLowEnd ? 2 : 5,
    debounceDelay: isLowEnd ? 500 : 300,
  };
};

// Import React for hook
import React from 'react';
