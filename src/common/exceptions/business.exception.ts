import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(
      {
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

export class ValidationException extends BusinessException {
  constructor(
    message: string,
    public readonly validationErrors: any[],
    public readonly field?: string,
  ) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', {
      validationErrors,
      field,
      totalErrors: validationErrors.length,
    });
  }
}

export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string, identifier: string | number) {
    super(
      `${resource} with identifier '${identifier}' not found`,
      HttpStatus.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      {
        resource,
        identifier,
      },
    );
  }
}

export class ConflictException extends BusinessException {
  constructor(
    message: string,
    public readonly conflictingField?: string,
    public readonly conflictingValue?: any,
  ) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT', {
      conflictingField,
      conflictingValue,
    });
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(
    message: string = 'Unauthorized access',
    public readonly reason?: string,
  ) {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', {
      reason,
    });
  }
}

export class ForbiddenException extends BusinessException {
  constructor(
    message: string = 'Access forbidden',
    public readonly requiredPermission?: string,
    public readonly userRole?: string,
  ) {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN', {
      requiredPermission,
      userRole,
    });
  }
}

export class RateLimitExceededException extends BusinessException {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    public readonly limit?: number,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', {
      retryAfter,
      limit,
    });
  }
}

export class ServiceUnavailableException extends BusinessException {
  constructor(
    service: string,
    message?: string,
    public readonly retryAfter?: number,
  ) {
    super(
      message || `${service} is currently unavailable`,
      HttpStatus.SERVICE_UNAVAILABLE,
      'SERVICE_UNAVAILABLE',
      {
        service,
        retryAfter,
      },
    );
  }
}

export class PaymentException extends BusinessException {
  constructor(
    message: string,
    public readonly paymentId?: string,
    public readonly provider?: string,
    public readonly providerError?: any,
  ) {
    super(message, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_ERROR', {
      paymentId,
      provider,
      providerError,
    });
  }
}

export class DatabaseException extends BusinessException {
  constructor(
    message: string,
    public readonly operation?: string,
    public readonly collection?: string,
    public readonly databaseError?: any,
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', {
      operation,
      collection,
      databaseError,
    });
  }
}

export class ExternalServiceException extends BusinessException {
  constructor(
    service: string,
    message: string,
    public readonly serviceError?: any,
    public readonly retryable: boolean = true,
  ) {
    super(
      message,
      retryable ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
      {
        service,
        serviceError,
        retryable,
      },
    );
  }
}
