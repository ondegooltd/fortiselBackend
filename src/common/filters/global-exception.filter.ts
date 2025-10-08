import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
  requestId?: string;
  details?: any;
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId;

    let status: number;
    let message: string | string[];
    let error: string;
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
        details = responseObj.details;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
      details = {
        name: exception.name,
        message: exception.message,
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      error = 'UnknownError';
      details = { originalError: exception };
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId,
      details,
    };

    // Log the error with appropriate level
    this.logError(exception, request, errorResponse);

    // Don't expose stack trace in production
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack =
        exception instanceof Error ? exception.stack : undefined;
    }

    response.status(status).json(errorResponse);
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    const logContext = {
      requestId: (request as any).requestId,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      userId: (request as any).user?.userId,
      statusCode: errorResponse.statusCode,
      error: errorResponse.error,
    };

    if (errorResponse.statusCode >= 500) {
      // Server errors - log as error
      this.loggerService.logError(exception as Error, {
        ...logContext,
        type: 'server_error',
        severity: 'high',
      });
    } else if (errorResponse.statusCode >= 400) {
      // Client errors - log as warning
      this.loggerService.warn(`Client error: ${errorResponse.error}`, {
        ...logContext,
        type: 'client_error',
        severity: 'medium',
      });
    } else {
      // Other errors - log as info
      this.loggerService.log(`Application error: ${errorResponse.error}`, {
        ...logContext,
        type: 'application_error',
        severity: 'low',
      });
    }
  }
}
