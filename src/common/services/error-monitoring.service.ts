import { Injectable, Logger } from '@nestjs/common';
import { LoggerService } from './logger.service';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  recentErrors: Array<{
    timestamp: Date;
    type: string;
    severity: string;
    message: string;
    endpoint?: string;
  }>;
}

export interface ErrorAlert {
  id: string;
  type: 'error_rate' | 'critical_error' | 'service_down';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  resolved: boolean;
}

@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name);
  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsBySeverity: {},
    errorsByEndpoint: {},
    recentErrors: [],
  };
  private alerts: ErrorAlert[] = [];
  private readonly maxRecentErrors = 100;

  constructor(private readonly loggerService: LoggerService) {}

  /**
   * Record an error for monitoring
   */
  recordError(error: {
    type: string;
    severity: string;
    message: string;
    endpoint?: string;
    userId?: string;
    requestId?: string;
  }): void {
    // Update metrics
    this.errorMetrics.totalErrors++;

    this.errorMetrics.errorsByType[error.type] =
      (this.errorMetrics.errorsByType[error.type] || 0) + 1;

    this.errorMetrics.errorsBySeverity[error.severity] =
      (this.errorMetrics.errorsBySeverity[error.severity] || 0) + 1;

    if (error.endpoint) {
      this.errorMetrics.errorsByEndpoint[error.endpoint] =
        (this.errorMetrics.errorsByEndpoint[error.endpoint] || 0) + 1;
    }

    // Add to recent errors
    this.errorMetrics.recentErrors.unshift({
      timestamp: new Date(),
      type: error.type,
      severity: error.severity,
      message: error.message,
      endpoint: error.endpoint,
    });

    // Keep only recent errors
    if (this.errorMetrics.recentErrors.length > this.maxRecentErrors) {
      this.errorMetrics.recentErrors = this.errorMetrics.recentErrors.slice(
        0,
        this.maxRecentErrors,
      );
    }

    // Check for alerts
    this.checkForAlerts(error);

    // Log the error
    this.loggerService.logError(new Error(error.message), {
      type: error.type,
      severity: error.severity,
      endpoint: error.endpoint,
      userId: error.userId,
      requestId: error.requestId,
      monitoring: true,
    });
  }

  /**
   * Get current error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ErrorAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get error rate for a specific time window
   */
  getErrorRate(timeWindowMinutes: number = 60): number {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentErrors = this.errorMetrics.recentErrors.filter(
      (error) => error.timestamp >= cutoffTime,
    );

    return recentErrors.length / timeWindowMinutes;
  }

  /**
   * Get errors by type for a specific time window
   */
  getErrorsByType(timeWindowMinutes: number = 60): Record<string, number> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentErrors = this.errorMetrics.recentErrors.filter(
      (error) => error.timestamp >= cutoffTime,
    );

    const errorsByType: Record<string, number> = {};
    recentErrors.forEach((error) => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return errorsByType;
  }

  /**
   * Get critical errors (high severity) for a specific time window
   */
  getCriticalErrors(timeWindowMinutes: number = 60): Array<{
    timestamp: Date;
    type: string;
    message: string;
    endpoint?: string;
  }> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return this.errorMetrics.recentErrors
      .filter(
        (error) => error.timestamp >= cutoffTime && error.severity === 'high',
      )
      .map((error) => ({
        timestamp: error.timestamp,
        type: error.type,
        message: error.message,
        endpoint: error.endpoint,
      }));
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      errorsByEndpoint: {},
      recentErrors: [],
    };

    this.loggerService.log('Error metrics reset', {
      type: 'metrics_reset',
    });
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.loggerService.log(`Alert resolved: ${alertId}`, {
        alertId,
        alertType: alert.type,
        type: 'alert_resolved',
      });
      return true;
    }
    return false;
  }

  /**
   * Get error trends over time
   */
  getErrorTrends(hours: number = 24): Array<{
    hour: string;
    errorCount: number;
    errorsByType: Record<string, number>;
  }> {
    const trends: Array<{
      hour: string;
      errorCount: number;
      errorsByType: Record<string, number>;
    }> = [];

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(Date.now() - i * 60 * 60 * 1000);
      const hourEnd = new Date(Date.now() - (i - 1) * 60 * 60 * 1000);

      const hourErrors = this.errorMetrics.recentErrors.filter(
        (error) => error.timestamp >= hourStart && error.timestamp < hourEnd,
      );

      const errorsByType: Record<string, number> = {};
      hourErrors.forEach((error) => {
        errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      });

      trends.push({
        hour: hourStart.toISOString().substring(0, 13) + ':00:00Z',
        errorCount: hourErrors.length,
        errorsByType,
      });
    }

    return trends;
  }

  private checkForAlerts(error: {
    type: string;
    severity: string;
    message: string;
    endpoint?: string;
  }): void {
    // Check for high error rate
    const errorRate = this.getErrorRate(5); // Last 5 minutes
    if (errorRate > 10) {
      // More than 10 errors per minute
      this.createAlert({
        type: 'error_rate',
        severity: 'high',
        message: `High error rate detected: ${errorRate.toFixed(2)} errors/minute`,
        threshold: 10,
        currentValue: errorRate,
      });
    }

    // Check for critical errors
    if (error.severity === 'critical') {
      this.createAlert({
        type: 'critical_error',
        severity: 'critical',
        message: `Critical error: ${error.message}`,
      });
    }

    // Check for service-specific issues
    if (error.type === 'database_error' && error.severity === 'high') {
      this.createAlert({
        type: 'service_down',
        severity: 'critical',
        message: 'Database service experiencing issues',
      });
    }
  }

  private createAlert(
    alertData: Omit<ErrorAlert, 'id' | 'timestamp' | 'resolved'>,
  ): void {
    const alert: ErrorAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    this.loggerService.log(`Alert created: ${alert.message}`, {
      alertId: alert.id,
      alertType: alert.type,
      severity: alert.severity,
      type: 'alert_created',
    });
  }
}
