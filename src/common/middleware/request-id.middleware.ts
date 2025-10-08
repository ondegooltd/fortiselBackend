import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or extract request ID
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Add request ID to request object
    (req as any).requestId = requestId;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    // Log request start
    this.loggerService.log('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      type: 'request_start',
    });

    // Override res.end to log request completion
    const originalEnd = res.end;
    const middleware = this;
    res.end = function (chunk?: any, encoding?: any): any {
      // Log request completion
      middleware.loggerService.log('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: Date.now() - (req as any).startTime,
        type: 'request_complete',
      });

      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };

    // Set start time for response time calculation
    (req as any).startTime = Date.now();

    next();
  }
}
