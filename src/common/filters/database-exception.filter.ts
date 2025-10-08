import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { LoggerService } from '../services/logger.service';

export interface DatabaseErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error: string;
  requestId?: string;
  databaseError?: {
    code: number;
    name: string;
    operation?: string;
    collection?: string;
  };
}

@Catch(MongoError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: MongoError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId;

    const { statusCode, message, error, databaseError } =
      this.mapMongoError(exception);

    const errorResponse: DatabaseErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId,
      databaseError,
    };

    // Log database error with high severity
    this.loggerService.logError(exception, {
      requestId,
      method: request.method,
      url: request.url,
      databaseError,
      type: 'database_error',
      severity: 'high',
    });

    response.status(statusCode).json(errorResponse);
  }

  private mapMongoError(error: MongoError): {
    statusCode: number;
    message: string;
    error: string;
    databaseError: any;
  } {
    const databaseError = {
      code: error.code,
      name: error.name,
      operation: this.getOperationFromError(error),
      collection: this.getCollectionFromError(error),
    };

    switch (error.code) {
      case 11000: // Duplicate key error
        return {
          statusCode: 409,
          message: 'Resource already exists',
          error: 'Conflict',
          databaseError,
        };

      case 11001: // Duplicate key error (alternative)
        return {
          statusCode: 409,
          message: 'Duplicate key violation',
          error: 'Conflict',
          databaseError,
        };

      case 2: // Bad value
        return {
          statusCode: 400,
          message: 'Invalid data provided',
          error: 'BadRequest',
          databaseError,
        };

      case 6: // HostUnreachable
        return {
          statusCode: 503,
          message: 'Database connection failed',
          error: 'ServiceUnavailable',
          databaseError,
        };

      case 7: // HostNotFound
        return {
          statusCode: 503,
          message: 'Database host not found',
          error: 'ServiceUnavailable',
          databaseError,
        };

      case 8: // UnknownError
        return {
          statusCode: 500,
          message: 'Database operation failed',
          error: 'InternalServerError',
          databaseError,
        };

      case 9: // FailedToParse
        return {
          statusCode: 400,
          message: 'Invalid query syntax',
          error: 'BadRequest',
          databaseError,
        };

      case 11: // UserNotFound
        return {
          statusCode: 401,
          message: 'Database authentication failed',
          error: 'Unauthorized',
          databaseError,
        };

      case 18: // AuthenticationFailed
        return {
          statusCode: 401,
          message: 'Database authentication failed',
          error: 'Unauthorized',
          databaseError,
        };

      case 20: // IllegalOperation
        return {
          statusCode: 400,
          message: 'Invalid database operation',
          error: 'BadRequest',
          databaseError,
        };

      case 22: // InvalidBSON
        return {
          statusCode: 400,
          message: 'Invalid data format',
          error: 'BadRequest',
          databaseError,
        };

      case 50: // MaxBSONSizeExceeded
        return {
          statusCode: 413,
          message: 'Document size exceeds limit',
          error: 'PayloadTooLarge',
          databaseError,
        };

      case 51: // InvalidID
        return {
          statusCode: 400,
          message: 'Invalid document ID',
          error: 'BadRequest',
          databaseError,
        };

      case 10334: // NamespaceNotFound
        return {
          statusCode: 404,
          message: 'Collection not found',
          error: 'NotFound',
          databaseError,
        };

      default:
        return {
          statusCode: 500,
          message: 'Database operation failed',
          error: 'InternalServerError',
          databaseError,
        };
    }
  }

  private getOperationFromError(error: MongoError): string | undefined {
    const message = error.message.toLowerCase();

    if (message.includes('insert')) return 'insert';
    if (message.includes('update')) return 'update';
    if (message.includes('delete')) return 'delete';
    if (message.includes('find')) return 'find';
    if (message.includes('aggregate')) return 'aggregate';
    if (message.includes('createindex')) return 'createIndex';
    if (message.includes('dropindex')) return 'dropIndex';

    return undefined;
  }

  private getCollectionFromError(error: MongoError): string | undefined {
    const message = error.message;
    const collectionMatch = message.match(/collection: ([a-zA-Z0-9_.]+)/);
    return collectionMatch ? collectionMatch[1] : undefined;
  }
}
