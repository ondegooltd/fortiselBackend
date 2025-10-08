import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { req, res } = this.getRequestResponse(requestProps.context);
    const key = this.generateKey(requestProps.context, req.ip, 'default');
    const totalHits = await this.storageService.increment(
      key,
      requestProps.ttl,
      requestProps.limit,
      0,
      'default',
    );

    if (totalHits.totalHits > requestProps.limit) {
      const retryAfter = Math.ceil(requestProps.ttl / 1000);
      res.setHeader('Retry-After', retryAfter);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    res.setHeader('X-RateLimit-Limit', requestProps.limit);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, requestProps.limit - totalHits.totalHits),
    );
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + requestProps.ttl).toISOString(),
    );

    return true;
  }
}
