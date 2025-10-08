import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Add request ID to request object
    (req as any).requestId = requestId;

    // Log incoming request
    this.logger.log('Incoming Request', {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      type: 'request_start',
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;

      // Log response
      this.logger.logRequest(
        req.method,
        req.url,
        res.statusCode,
        responseTime,
        {
          requestId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        },
      );

      // Call original end
      originalEnd.call(this, chunk, encoding);
    }.bind(this);

    next();
  }
}
