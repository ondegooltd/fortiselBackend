import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  constructor(private logger: LoggerService) {}

  /**
   * Measure the execution time of an async operation
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.recordMetric(operation, duration, metadata);
      this.logger.logPerformance(operation, duration, metadata);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration, { ...metadata, error: true });
      this.logger.logError(error as Error, {
        operation,
        duration,
        ...metadata,
        type: 'performance_error',
      });
      throw error;
    }
  }

  /**
   * Measure the execution time of a sync operation
   */
  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    const startTime = Date.now();

    try {
      const result = fn();
      const duration = Date.now() - startTime;

      this.recordMetric(operation, duration, metadata);
      this.logger.logPerformance(operation, duration, metadata);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration, { ...metadata, error: true });
      this.logger.logError(error as Error, {
        operation,
        duration,
        ...metadata,
        type: 'performance_error',
      });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation?: string): {
    total: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    const metrics = operation
      ? this.metrics.filter((m) => m.operation === operation)
      : this.metrics;

    if (metrics.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
      };
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    const average = total / durations.length;
    const min = durations[0];
    const max = durations[durations.length - 1];
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95 = durations[p95Index] || 0;
    const p99 = durations[p99Index] || 0;

    return {
      total: durations.length,
      average: Math.round(average),
      min,
      max,
      p95,
      p99,
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics by operation
   */
  getMetricsByOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.operation === operation);
  }

  private recordMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);
    this.clearOldMetrics();
  }
}
