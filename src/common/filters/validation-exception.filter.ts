import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';
import { LoggerService } from '../services/logger.service';

export interface ValidationErrorDetail {
  field: string;
  value: any;
  constraints: string[];
  children?: ValidationErrorDetail[];
}

export interface ValidationErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error: string;
  requestId?: string;
  validationErrors: ValidationErrorDetail[];
  totalErrors: number;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId;

    const exceptionResponse = exception.getResponse();
    let validationErrors: ValidationErrorDetail[] = [];
    let totalErrors = 0;

    // Extract validation errors from the exception response
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;

      if (Array.isArray(responseObj.message)) {
        // Handle class-validator errors
        validationErrors = this.formatValidationErrors(responseObj.message);
        totalErrors = this.countTotalErrors(validationErrors);
      } else if (responseObj.message) {
        // Handle single validation error
        validationErrors = [
          {
            field: 'general',
            value: null,
            constraints: [responseObj.message],
          },
        ];
        totalErrors = 1;
      }
    }

    const errorResponse: ValidationErrorResponse = {
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Validation failed',
      error: 'BadRequest',
      requestId,
      validationErrors,
      totalErrors,
    };

    // Log validation errors
    this.loggerService.warn('Validation failed', {
      requestId,
      method: request.method,
      url: request.url,
      validationErrors,
      totalErrors,
      type: 'validation_error',
      severity: 'medium',
    });

    response.status(400).json(errorResponse);
  }

  private formatValidationErrors(errors: any[]): ValidationErrorDetail[] {
    return errors.map((error) => {
      const detail: ValidationErrorDetail = {
        field: error.property || 'unknown',
        value: error.value,
        constraints: error.constraints ? Object.values(error.constraints) : [],
      };

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        detail.children = this.formatValidationErrors(error.children);
      }

      return detail;
    });
  }

  private countTotalErrors(errors: ValidationErrorDetail[]): number {
    let count = errors.length;

    errors.forEach((error) => {
      if (error.children && error.children.length > 0) {
        count += this.countTotalErrors(error.children);
      }
    });

    return count;
  }
}
