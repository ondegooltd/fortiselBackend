import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class ApiVersionGuard implements CanActivate {
  private readonly logger = new Logger(ApiVersionGuard.name);
  private readonly supportedVersions = ['v1', 'v2'];
  private readonly defaultVersion = 'v1';

  constructor(private readonly loggerService: LoggerService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const version = this.extractApiVersion(request);

    if (!this.isVersionSupported(version)) {
      this.loggerService.log(`Unsupported API version requested: ${version}`, {
        version,
        supportedVersions: this.supportedVersions,
        type: 'api_version_unsupported',
      });

      throw new BadRequestException({
        message: 'Unsupported API version',
        supportedVersions: this.supportedVersions,
        requestedVersion: version,
      });
    }

    // Add version to request for use in controllers
    request.apiVersion = version;

    this.loggerService.log(`API version validated: ${version}`, {
      version,
      type: 'api_version_validated',
    });

    return true;
  }

  private extractApiVersion(request: any): string {
    // 1. Check URL path for version (e.g., /api/v1/users)
    const path = request.url;
    const pathVersionMatch = path.match(/\/api\/v(\d+)/);
    if (pathVersionMatch) {
      return `v${pathVersionMatch[1]}`;
    }

    // 2. Check headers
    const headerVersion =
      request.headers['api-version'] || request.headers['x-api-version'];
    if (headerVersion) {
      return headerVersion;
    }

    // 3. Check query parameter
    const queryVersion = request.query.version;
    if (queryVersion) {
      return queryVersion;
    }

    // 4. Return default version
    return this.defaultVersion;
  }

  private isVersionSupported(version: string): boolean {
    return this.supportedVersions.includes(version);
  }

  /**
   * Get supported API versions
   */
  getSupportedVersions(): string[] {
    return [...this.supportedVersions];
  }

  /**
   * Get default API version
   */
  getDefaultVersion(): string {
    return this.defaultVersion;
  }
}
