import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { LoggerService } from '../common/services/logger.service';
import * as os from 'os';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const diskusage = require('diskusage');

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    @InjectConnection() private connection: Connection,
  ) {}

  @Get()
  async getHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check database connection
      const dbStatus = await this.checkDatabase();
      const dbResponseTime = Date.now() - startTime;

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryTotal = memoryUsage.heapTotal;
      const memoryUsed = memoryUsage.heapUsed;
      const memoryPercentage = (memoryUsed / memoryTotal) * 100;

      // Check disk usage (simplified)
      const diskUsage = this.getDiskUsage();

      const health: HealthCheckResult = {
        status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: this.configService.get('nodeEnv') || 'development',
        services: {
          database: {
            status: dbStatus,
            responseTime: dbResponseTime,
          },
          memory: {
            used: Math.round(memoryUsed / 1024 / 1024), // MB
            total: Math.round(memoryTotal / 1024 / 1024), // MB
            percentage: Math.round(memoryPercentage),
          },
          disk: diskUsage,
        },
      };

      // Log health check
      this.logger.log('Health Check', {
        status: health.status,
        responseTime: Date.now() - startTime,
        type: 'health_check',
      });

      return health;
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'health_check_error',
      });

      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('ready')
  async getReadiness(): Promise<{ status: string; timestamp: string }> {
    try {
      // Check if all required services are ready
      const dbStatus = await this.checkDatabase();

      if (dbStatus !== 'connected') {
        throw new HttpException(
          {
            status: 'not ready',
            timestamp: new Date().toISOString(),
            reason: 'Database not connected',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'readiness_check_error',
      });
      throw error;
    }
  }

  @Get('live')
  getLiveness(): { status: string; timestamp: string } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      const state = this.connection.readyState;
      return state === 1 ? 'connected' : 'disconnected';
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'database_health_check',
      });
      return 'disconnected';
    }
  }

  private getDiskUsage(): { used: number; total: number; percentage: number } {
    try {
      // Get the root path (platform-specific)
      const rootPath = os.platform() === 'win32' ? 'C:' : '/';

      // Get real disk usage
      const stats = diskusage.checkSync(rootPath);
      const total = stats.total;
      const free = stats.available;
      const used = total - free;
      const percentage = (used / total) * 100;

      return {
        used: Math.round(used / 1024 / 1024), // MB
        total: Math.round(total / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      // Fallback to simplified calculation if diskusage fails
      this.logger.logError(error as Error, {
        type: 'disk_usage_error',
      });

      // Return default values
      const total = 100 * 1024 * 1024 * 1024; // 100GB (fallback)
      const used = 50 * 1024 * 1024 * 1024; // 50GB (fallback)
      const percentage = (used / total) * 100;

      return {
        used: Math.round(used / 1024 / 1024), // MB
        total: Math.round(total / 1024 / 1024), // MB
        percentage: Math.round(percentage),
      };
    }
  }
}
