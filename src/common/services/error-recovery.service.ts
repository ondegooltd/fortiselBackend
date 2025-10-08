import { Injectable, Logger } from '@nestjs/common';
import { LoggerService } from './logger.service';

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface RecoveryAction {
  name: string;
  execute: () => Promise<any>;
  fallback?: () => Promise<any>;
}

@Injectable()
export class ErrorRecoveryService {
  private readonly logger = new Logger(ErrorRecoveryService.name);

  constructor(private readonly loggerService: LoggerService) {}

  /**
   * Retry an operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {
      maxAttempts: 3,
      delay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000,
    },
    context: string = 'Unknown operation',
  ): Promise<T> {
    let lastError: Error;
    let currentDelay = config.delay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        this.loggerService.log(
          `Attempting ${context} (attempt ${attempt}/${config.maxAttempts})`,
          {
            operation: context,
            attempt,
            maxAttempts: config.maxAttempts,
            type: 'retry_attempt',
          },
        );

        const result = await operation();

        if (attempt > 1) {
          this.loggerService.log(
            `${context} succeeded after ${attempt} attempts`,
            {
              operation: context,
              attempts: attempt,
              type: 'retry_success',
            },
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        this.loggerService.logError(lastError, {
          operation: context,
          attempt,
          maxAttempts: config.maxAttempts,
          type: 'retry_error',
        });

        if (attempt === config.maxAttempts) {
          this.loggerService.logError(lastError, {
            operation: context,
            attempts: attempt,
            type: 'retry_failed',
            severity: 'high',
          });
          break;
        }

        // Wait before next attempt
        await this.delay(currentDelay);
        currentDelay = Math.min(
          currentDelay * config.backoffMultiplier,
          config.maxDelay,
        );
      }
    }

    throw lastError!;
  }

  /**
   * Execute recovery actions in sequence
   */
  async executeRecoveryActions(
    actions: RecoveryAction[],
    context: string = 'Recovery actions',
  ): Promise<{ success: boolean; results: any[]; errors: Error[] }> {
    const results: any[] = [];
    const errors: Error[] = [];

    this.loggerService.log(`Starting recovery actions for ${context}`, {
      actionCount: actions.length,
      context,
      type: 'recovery_start',
    });

    for (const action of actions) {
      try {
        this.loggerService.log(`Executing recovery action: ${action.name}`, {
          action: action.name,
          context,
          type: 'recovery_action',
        });

        const result = await action.execute();
        results.push(result);

        this.loggerService.log(
          `Recovery action ${action.name} completed successfully`,
          {
            action: action.name,
            context,
            type: 'recovery_success',
          },
        );
      } catch (error) {
        const errorObj = error as Error;
        errors.push(errorObj);

        this.loggerService.logError(errorObj, {
          action: action.name,
          context,
          type: 'recovery_error',
        });

        // Try fallback if available
        if (action.fallback) {
          try {
            this.loggerService.log(`Executing fallback for ${action.name}`, {
              action: action.name,
              context,
              type: 'recovery_fallback',
            });

            const fallbackResult = await action.fallback();
            results.push(fallbackResult);

            this.loggerService.log(
              `Fallback for ${action.name} completed successfully`,
              {
                action: action.name,
                context,
                type: 'recovery_fallback_success',
              },
            );
          } catch (fallbackError) {
            this.loggerService.logError(fallbackError as Error, {
              action: action.name,
              context,
              type: 'recovery_fallback_error',
              severity: 'high',
            });
          }
        }
      }
    }

    const success = errors.length === 0;

    this.loggerService.log(`Recovery actions completed for ${context}`, {
      context,
      success,
      actionCount: actions.length,
      successCount: results.length,
      errorCount: errors.length,
      type: 'recovery_complete',
    });

    return { success, results, errors };
  }

  /**
   * Circuit breaker pattern implementation
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitName: string,
    failureThreshold: number = 5,
    timeout: number = 10000,
  ): Promise<T> {
    // This is a simplified circuit breaker implementation
    // In production, you might want to use a more sophisticated library

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeout);
      });

      const result = await Promise.race([operation(), timeoutPromise]);

      this.loggerService.log(
        `Circuit breaker ${circuitName} operation succeeded`,
        {
          circuit: circuitName,
          type: 'circuit_breaker_success',
        },
      );

      return result;
    } catch (error) {
      this.loggerService.logError(error as Error, {
        circuit: circuitName,
        type: 'circuit_breaker_error',
        severity: 'medium',
      });

      throw error;
    }
  }

  /**
   * Graceful shutdown handler
   */
  async handleGracefulShutdown(
    cleanupActions: (() => Promise<void>)[],
    timeout: number = 30000,
  ): Promise<void> {
    this.loggerService.log('Starting graceful shutdown', {
      actionCount: cleanupActions.length,
      timeout,
      type: 'graceful_shutdown_start',
    });

    const shutdownPromise = Promise.all(
      cleanupActions.map(async (action, index) => {
        try {
          await action();
          this.loggerService.log(`Cleanup action ${index + 1} completed`, {
            actionIndex: index + 1,
            type: 'cleanup_success',
          });
        } catch (error) {
          this.loggerService.logError(error as Error, {
            actionIndex: index + 1,
            type: 'cleanup_error',
          });
        }
      }),
    );

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Shutdown timeout')), timeout);
    });

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      this.loggerService.log('Graceful shutdown completed', {
        type: 'graceful_shutdown_complete',
      });
    } catch (error) {
      this.loggerService.logError(error as Error, {
        type: 'graceful_shutdown_timeout',
        severity: 'high',
      });
    }
  }

  /**
   * Health check with recovery
   */
  async performHealthCheckWithRecovery(
    healthChecks: (() => Promise<boolean>)[],
    recoveryActions: RecoveryAction[],
  ): Promise<{ healthy: boolean; recovered: boolean }> {
    const results = await Promise.allSettled(
      healthChecks.map((check) => check()),
    );

    const healthy = results.every(
      (result) => result.status === 'fulfilled' && result.value === true,
    );

    if (!healthy && recoveryActions.length > 0) {
      this.loggerService.log('Health check failed, attempting recovery', {
        failedChecks: results.filter((r) => r.status === 'rejected').length,
        recoveryActions: recoveryActions.length,
        type: 'health_check_recovery',
      });

      const recovery = await this.executeRecoveryActions(
        recoveryActions,
        'Health check recovery',
      );

      return {
        healthy: recovery.success,
        recovered: recovery.success,
      };
    }

    return {
      healthy,
      recovered: false,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
