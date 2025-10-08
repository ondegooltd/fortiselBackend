import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const maxSize = this.configService.get('security.maxRequestSize') || '10mb';
    const maxSizeBytes = this.parseSizeToBytes(maxSize);

    // Set up request size monitoring
    let receivedBytes = 0;

    // Monitor incoming data
    req.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;

      if (receivedBytes > maxSizeBytes) {
        req.destroy();
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
            message: `Request size exceeds maximum allowed size of ${maxSize}`,
            error: 'Payload Too Large',
          },
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }
    });

    // Set response headers for client awareness
    res.setHeader('X-Max-Request-Size', maxSize);

    next();
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
