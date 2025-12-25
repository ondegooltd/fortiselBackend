import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  ValidationPipe,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { RequestSizeMiddleware } from './common/middleware/request-size.middleware';
import { CorsValidationMiddleware } from './common/middleware/cors-validation.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { LoggerService } from './common/services/logger.service';
import { ErrorMonitoringService } from './common/services/error-monitoring.service';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { TransactionInterceptor } from './common/interceptors/transaction.interceptor';
import { BusinessRuleInterceptor } from './common/interceptors/business-rule.interceptor';
import { ApiVersionGuard } from './common/guards/api-version.guard';
import { TransactionService } from './common/services/transaction.service';
import { BusinessRuleValidator } from './common/validators/business-rule.validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const errorMonitoringService = app.get(ErrorMonitoringService);

  // Apply security middleware
  app.use(
    new SecurityMiddleware(configService).use.bind(
      new SecurityMiddleware(configService),
    ),
  );
  app.use(
    new RequestSizeMiddleware(configService).use.bind(
      new RequestSizeMiddleware(configService),
    ),
  );
  app.use(
    new CorsValidationMiddleware(configService).use.bind(
      new CorsValidationMiddleware(configService),
    ),
  );
  app.use(
    new RequestIdMiddleware(loggerService).use.bind(
      new RequestIdMiddleware(loggerService),
    ),
  );

  // CORS configuration from environment
  app.enableCors({
    origin: configService.get('cors.origins'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global exception filters
  app.useGlobalFilters(
    new GlobalExceptionFilter(loggerService),
    new ValidationExceptionFilter(loggerService),
    new DatabaseExceptionFilter(loggerService),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(loggerService),
    new TransactionInterceptor(
      app.get(TransactionService),
      app.get('Reflector'),
      loggerService,
    ),
    new BusinessRuleInterceptor(
      app.get(BusinessRuleValidator),
      app.get('Reflector'),
      loggerService,
    ),
  );

  // Global guards
  app.useGlobalGuards(new ApiVersionGuard(loggerService));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set global prefix for all routes
  const apiPrefix = configService.get('apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Fortisel API')
    .setDescription('API documentation for the Fortisel LPG backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('port') || 3000;
  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  console.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
