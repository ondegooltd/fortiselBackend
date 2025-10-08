import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CorsValidationMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = this.configService.get('cors.origins') || [];
    const origin = req.headers.origin;

    // Skip CORS validation for same-origin requests
    if (!origin) {
      return next();
    }

    // Validate origin
    if (!this.isOriginAllowed(origin, allowedOrigins)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'CORS policy violation: Origin not allowed',
          error: 'Forbidden',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Validate HTTP methods
    if (!this.isMethodAllowed(req.method)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.METHOD_NOT_ALLOWED,
          message: 'CORS policy violation: Method not allowed',
          error: 'Method Not Allowed',
        },
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }

    // Set CORS headers
    this.setCorsHeaders(res, origin);

    next();
  }

  private isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      const localhostPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      ];

      if (localhostPatterns.some((pattern) => pattern.test(origin))) {
        return true;
      }
    }

    return allowedOrigins.includes(origin);
  }

  private isMethodAllowed(method: string): boolean {
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    return allowedMethods.includes(method.toUpperCase());
  }

  private setCorsHeaders(res: Response, origin: string) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
}
