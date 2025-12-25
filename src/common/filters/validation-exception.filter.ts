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
import { ValidationException } from '../exceptions/business.exception';

export interface ValidationErrorDetail {
  field: string;
  value: any;
  constraints: string[];
  children?: ValidationErrorDetail[];
}

export interface FormattedValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error: string;
  requestId?: string;
  validationErrors: FormattedValidationError[];
  totalErrors: number;
}

@Catch(BadRequestException, ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  constructor(private readonly loggerService: LoggerService) {}

  catch(
    exception: BadRequestException | ValidationException,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId;

    const exceptionResponse = exception.getResponse();
    let validationErrors: ValidationErrorDetail[] = [];
    let totalErrors = 0;

    // Log the exception response for debugging
    this.logger.debug('Exception response:', {
      exceptionResponse,
      exceptionType: exception.constructor.name,
      requestId,
    });

    // Handle ValidationException (from our custom validation pipe)
    if (exception instanceof ValidationException) {
      validationErrors = this.formatValidationErrors(
        exception.validationErrors,
      );
      totalErrors = this.countTotalErrors(validationErrors);
    } else {
      // Extract validation errors from the exception response (BadRequestException)
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;

        // Log the response object structure
        this.logger.debug('Response object:', {
          responseObj,
          hasMessage: !!responseObj.message,
          messageIsArray: Array.isArray(responseObj.message),
          requestId,
        });

        if (Array.isArray(responseObj.message)) {
          // Handle class-validator errors
          // Check if messages are strings or objects
          const firstMessage = responseObj.message[0];
          if (typeof firstMessage === 'string') {
            // Messages are strings - this happens when ValidationPipe returns simplified error messages
            // We need to extract field names from the error messages or use a different approach
            validationErrors = responseObj.message.map(
              (msg: string, index: number) => {
                // Try to extract field name from message (e.g., "Pickup address must be..." -> "pickupAddress")
                let field = 'unknown';
                const lowerMsg = msg.toLowerCase();
                if (lowerMsg.includes('pickup address')) {
                  field = 'pickupAddress';
                } else if (
                  lowerMsg.includes('drop-off address') ||
                  lowerMsg.includes('dropoff address')
                ) {
                  field = 'dropOffAddress';
                } else if (lowerMsg.includes('receiver name')) {
                  field = 'receiverName';
                } else if (lowerMsg.includes('receiver phone')) {
                  field = 'receiverPhone';
                } else if (lowerMsg.includes('cylinder size')) {
                  field = 'cylinderSize';
                } else if (lowerMsg.includes('quantity')) {
                  field = 'quantity';
                } else if (lowerMsg.includes('refill amount')) {
                  field = 'refillAmount';
                } else if (lowerMsg.includes('delivery fee')) {
                  field = 'deliveryFee';
                } else if (lowerMsg.includes('total amount')) {
                  field = 'totalAmount';
                } else if (lowerMsg.includes('payment method')) {
                  field = 'paymentMethod';
                } else if (lowerMsg.includes('notes')) {
                  field = 'notes';
                } else if (lowerMsg.includes('scheduled date')) {
                  field = 'scheduledDate';
                } else if (lowerMsg.includes('scheduled time')) {
                  field = 'scheduledTime';
                } else if (
                  lowerMsg.includes('must be one of the following values')
                ) {
                  // This is usually for enum validation errors
                  if (lowerMsg.includes('cylinder size')) {
                    field = 'cylinderSize';
                  } else if (lowerMsg.includes('payment method')) {
                    field = 'paymentMethod';
                  } else if (lowerMsg.includes('status')) {
                    field = 'status';
                  }
                } else if (
                  lowerMsg.includes('must be a mongodb id') ||
                  lowerMsg.includes('must be a mongo id')
                ) {
                  // MongoDB ID validation errors
                  if (lowerMsg.includes('order')) {
                    field = 'orderId';
                  } else if (lowerMsg.includes('user')) {
                    field = 'userId';
                  }
                }

                return {
                  field,
                  value: null,
                  constraints: [msg],
                };
              },
            );
          } else {
            // Messages are objects with property, constraints, etc.
            validationErrors = this.formatValidationErrors(responseObj.message);
          }
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
    }

    // Format validation errors for frontend
    const formattedValidationErrors = validationErrors.map((err) => ({
      field: err.field,
      message: Array.isArray(err.constraints)
        ? err.constraints.join(', ')
        : err.constraints?.[0] || 'Validation error',
      value: err.value,
    }));

    const errorResponse: ValidationErrorResponse = {
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Validation failed',
      error: 'BadRequest',
      requestId,
      validationErrors: formattedValidationErrors,
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
      // Extract constraints properly - can be an object with constraint names as keys
      let constraints: string[] = [];

      // Log the error structure for debugging
      this.logger.debug('Formatting validation error:', {
        error,
        hasConstraints: !!error.constraints,
        constraintsType: typeof error.constraints,
        property: error.property,
      });

      if (error.constraints) {
        if (
          typeof error.constraints === 'object' &&
          !Array.isArray(error.constraints)
        ) {
          // Constraints is an object like { isNotEmpty: 'field should not be empty', min: 'field must be at least X' }
          constraints = Object.values(error.constraints) as string[];
        } else if (Array.isArray(error.constraints)) {
          constraints = error.constraints;
        }
      }

      // If no constraints found, try to get message from error itself
      if (constraints.length === 0 && error.message) {
        constraints = [error.message];
      }

      const detail: ValidationErrorDetail = {
        field: error.property || error.field || 'unknown',
        value: error.value,
        constraints: constraints,
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
