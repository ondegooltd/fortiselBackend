import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  BaseResponseDto,
  PaginatedResponseDto,
  ErrorResponseDto,
} from '../dto/base-response.dto';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseTransformInterceptor.name);

  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestId = (request as any).requestId;

    return next.handle().pipe(
      map((data) => {
        // Transform successful responses
        if (this.isPaginatedResponse(data)) {
          return PaginatedResponseDto.create(
            data.data,
            data.pagination,
            data.message || 'Success',
            requestId,
            this.getApiVersion(request),
          );
        }

        if (this.isBaseResponse(data)) {
          return data; // Already transformed
        }

        // Transform raw data to BaseResponseDto
        return BaseResponseDto.success(
          data,
          'Success',
          requestId,
          this.getApiVersion(request),
        );
      }),
      catchError((error) => {
        this.loggerService.logError(error, {
          requestId,
          type: 'response_transform_error',
        });

        // Transform error responses
        const errorResponse = this.transformError(error, request);
        throw new HttpException(
          errorResponse,
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      Array.isArray(data.data) &&
      data.pagination &&
      typeof data.pagination === 'object' &&
      'page' in data.pagination &&
      'limit' in data.pagination &&
      'total' in data.pagination
    );
  }

  private isBaseResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'message' in data &&
      'timestamp' in data
    );
  }

  private transformError(error: any, request: any): ErrorResponseDto {
    const requestId = (request as any).requestId;
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    // Handle validation errors
    if (status === 400 && error.response) {
      const response = error.response;
      if (response.validationErrors) {
        return ErrorResponseDto.create(
          message,
          'VALIDATION_ERROR',
          response.validationErrors,
          undefined,
          requestId,
          this.getApiVersion(request),
        );
      }

      if (response.violations) {
        return ErrorResponseDto.create(
          message,
          'BUSINESS_RULE_VIOLATION',
          undefined,
          response.violations,
          requestId,
          this.getApiVersion(request),
        );
      }
    }

    // Handle other errors
    return ErrorResponseDto.create(
      message,
      this.getErrorCode(status),
      undefined,
      undefined,
      requestId,
      this.getApiVersion(request),
    );
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private getApiVersion(request: any): string {
    // Extract API version from request headers or URL
    const version =
      request.headers['api-version'] || request.headers['x-api-version'];
    if (version) {
      return version;
    }

    // Extract from URL path (e.g., /api/v1/users)
    const path = request.url;
    const versionMatch = path.match(/\/api\/v(\d+)/);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }

    // Default version
    return 'v1';
  }
}
