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
        // If it's an HttpException (like BadRequestException from ValidationPipe),
        // let it pass through to the exception filters instead of transforming it
        // The exception filters will handle it properly
        if (error instanceof HttpException) {
          // Re-throw to let exception filters handle it
          throw error;
        }

        // Log the raw error for debugging
        this.loggerService.logError(error, {
          requestId,
          type: 'response_transform_error',
          errorType: error.constructor?.name,
          hasGetResponse: typeof error.getResponse === 'function',
          errorResponse: error.getResponse ? error.getResponse() : undefined,
        });

        // Transform error responses for non-HttpException errors
        const errorResponse = this.transformError(error, request);
        throw new HttpException(
          errorResponse,
          error.status ||
            error.getStatus?.() ||
            HttpStatus.INTERNAL_SERVER_ERROR,
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
    const status = error.status || error.getStatus?.() || 500;
    const message = error.message || 'Internal server error';

    // Handle HttpException (from NestJS ValidationPipe or other sources)
    if (error instanceof HttpException || error.getResponse) {
      const exceptionResponse = error.getResponse();

      // Handle validation errors from ValidationPipe (BadRequestException)
      if (
        status === 400 &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;

        // Check if it's a validation error array (from ValidationPipe)
        if (Array.isArray(responseObj.message)) {
          const validationErrors = responseObj.message.map((err: any) => ({
            field: err.property || 'unknown',
            message: err.constraints
              ? Object.values(err.constraints)[0]
              : err.toString(),
            value: err.value,
          }));

          return ErrorResponseDto.create(
            'Validation failed',
            'VALIDATION_ERROR',
            validationErrors,
            undefined,
            requestId,
            this.getApiVersion(request),
          );
        }

        // Check for validationErrors property (from ValidationExceptionFilter)
        if (responseObj.validationErrors) {
          const validationErrors = responseObj.validationErrors.map(
            (err: any) => ({
              field: err.field || 'unknown',
              message: err.constraints
                ? err.constraints.join(', ')
                : err.message || 'Validation error',
              value: err.value,
            }),
          );

          return ErrorResponseDto.create(
            responseObj.message || 'Validation failed',
            'VALIDATION_ERROR',
            validationErrors,
            undefined,
            requestId,
            this.getApiVersion(request),
          );
        }

        // Check for violations (from BusinessRuleInterceptor)
        if (responseObj.violations) {
          return ErrorResponseDto.create(
            responseObj.message || 'Business rule validation failed',
            'BUSINESS_RULE_VIOLATION',
            undefined,
            responseObj.violations,
            requestId,
            this.getApiVersion(request),
          );
        }
      }
    }

    // Handle validation errors from error.response (Axios-style)
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
