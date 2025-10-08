import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Security Headers
    this.setSecurityHeaders(res);

    // Request Size Validation
    this.validateRequestSize(req, res);

    // CORS Validation
    this.validateCORS(req, res);

    next();
  }

  private setSecurityHeaders(res: Response) {
    // Prevent XSS attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';",
    );

    // Strict Transport Security (HTTPS only)
    if (this.configService.get('nodeEnv') === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
    );

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
  }

  private validateRequestSize(req: Request, res: Response) {
    const maxSize = this.configService.get('security.maxRequestSize') || '10mb';
    const maxSizeBytes = this.parseSizeToBytes(maxSize);

    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length'], 10);
      if (contentLength > maxSizeBytes) {
        res.status(413).json({
          statusCode: 413,
          message: 'Request entity too large',
          error: 'Payload Too Large',
        });
        return;
      }
    }
  }

  private validateCORS(req: Request, res: Response) {
    const allowedOrigins = this.configService.get('cors.origins') || [];
    const origin = req.headers.origin;

    if (origin && !allowedOrigins.includes(origin)) {
      res.status(403).json({
        statusCode: 403,
        message: 'CORS policy violation',
        error: 'Forbidden',
      });
      return;
    }
  }

  private parseSizeToBytes(size: string): number {
    const units = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB

    const value = parseFloat(match[1]);
    const unit = match[2] as keyof typeof units;

    return Math.floor(value * units[unit]);
  }
}
