import { Module } from '@nestjs/common';
import { ApiVersionGuard } from '../guards/api-version.guard';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { RequestIdMiddleware } from '../middleware/request-id.middleware';
import { LoggerService } from '../services/logger.service';

@Module({
  providers: [
    ApiVersionGuard,
    ResponseTransformInterceptor,
    RequestIdMiddleware,
    LoggerService,
  ],
  exports: [ApiVersionGuard, ResponseTransformInterceptor, RequestIdMiddleware],
})
export class ApiVersionModule {}
