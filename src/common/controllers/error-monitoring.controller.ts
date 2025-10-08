import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ErrorMonitoringService } from '../services/error-monitoring.service';
import { ErrorRecoveryService } from '../services/error-recovery.service';

@Controller('monitoring')
export class ErrorMonitoringController {
  constructor(
    private readonly errorMonitoringService: ErrorMonitoringService,
    private readonly errorRecoveryService: ErrorRecoveryService,
  ) {}

  @Get('errors/metrics')
  getErrorMetrics() {
    return this.errorMonitoringService.getErrorMetrics();
  }

  @Get('errors/rate')
  getErrorRate(@Param('minutes') minutes: number = 60) {
    return {
      errorRate: this.errorMonitoringService.getErrorRate(minutes),
      timeWindow: `${minutes} minutes`,
    };
  }

  @Get('errors/trends')
  getErrorTrends(@Param('hours') hours: number = 24) {
    return this.errorMonitoringService.getErrorTrends(hours);
  }

  @Get('errors/critical')
  getCriticalErrors(@Param('minutes') minutes: number = 60) {
    return this.errorMonitoringService.getCriticalErrors(minutes);
  }

  @Get('alerts')
  getActiveAlerts() {
    return this.errorMonitoringService.getActiveAlerts();
  }

  @Post('alerts/:alertId/resolve')
  @HttpCode(HttpStatus.OK)
  resolveAlert(@Param('alertId') alertId: string) {
    const resolved = this.errorMonitoringService.resolveAlert(alertId);
    return {
      success: resolved,
      message: resolved ? 'Alert resolved successfully' : 'Alert not found',
    };
  }

  @Post('recovery/health-check')
  @HttpCode(HttpStatus.OK)
  async performHealthCheckWithRecovery(
    @Body()
    config: {
      healthChecks: Array<() => Promise<boolean>>;
      recoveryActions: Array<{
        name: string;
        execute: () => Promise<any>;
        fallback?: () => Promise<any>;
      }>;
    },
  ) {
    const result =
      await this.errorRecoveryService.performHealthCheckWithRecovery(
        config.healthChecks,
        config.recoveryActions,
      );

    return result;
  }

  @Post('recovery/retry')
  @HttpCode(HttpStatus.OK)
  async retryOperation(
    @Body()
    config: {
      operation: () => Promise<any>;
      maxAttempts?: number;
      delay?: number;
      backoffMultiplier?: number;
      maxDelay?: number;
      context?: string;
    },
  ) {
    const result = await this.errorRecoveryService.retryOperation(
      config.operation,
      {
        maxAttempts: config.maxAttempts || 3,
        delay: config.delay || 1000,
        backoffMultiplier: config.backoffMultiplier || 2,
        maxDelay: config.maxDelay || 10000,
      },
      config.context || 'Manual retry',
    );

    return result;
  }

  @Post('recovery/actions')
  @HttpCode(HttpStatus.OK)
  async executeRecoveryActions(
    @Body()
    config: {
      actions: Array<{
        name: string;
        execute: () => Promise<any>;
        fallback?: () => Promise<any>;
      }>;
      context?: string;
    },
  ) {
    const result = await this.errorRecoveryService.executeRecoveryActions(
      config.actions,
      config.context || 'Manual recovery',
    );

    return result;
  }

  @Post('metrics/reset')
  @HttpCode(HttpStatus.OK)
  resetMetrics() {
    this.errorMonitoringService.resetMetrics();
    return {
      success: true,
      message: 'Error metrics reset successfully',
    };
  }
}
