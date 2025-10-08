import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order/order.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { DeliveryModule } from './delivery/delivery.module';
import { AdminModule } from './admin/admin.module';
import { CylinderModule } from './cylinder/cylinder.module';
import { SupportTicketModule } from './support-ticket/support-ticket.module';
import { NotificationModule } from './notification/notification.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { LoggerService } from './common/services/logger.service';
import { ErrorMonitoringService } from './common/services/error-monitoring.service';
import { ErrorRecoveryService } from './common/services/error-recovery.service';
import { ErrorMonitoringController } from './common/controllers/error-monitoring.controller';
import { TransactionModule } from './common/modules/transaction.module';
import { ApiVersionModule } from './common/modules/api-version.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),

    // Rate limiting configuration
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: 3, // 3 requests per second
        },
        {
          name: 'medium',
          ttl: 10000, // 10 seconds
          limit: 20, // 20 requests per 10 seconds
        },
        {
          name: 'long',
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
      ],
      inject: [ConfigService],
    }),

    // MongoDB connection with configuration
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        maxPoolSize: configService.get<number>('database.maxPoolSize'),
        serverSelectionTimeoutMS: configService.get<number>(
          'database.serverSelectionTimeoutMS',
        ),
        socketTimeoutMS: configService.get<number>('database.socketTimeoutMS'),
        retryWrites: true,
        w: 'majority',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    OrderModule,
    UserModule,
    PaymentModule,
    DeliveryModule,
    AdminModule,
    CylinderModule,
    SupportTicketModule,
    NotificationModule,
    HealthModule,
    DatabaseModule,
    TransactionModule,
    ApiVersionModule,
  ],
  controllers: [AppController, ErrorMonitoringController],
  providers: [
    AppService,
    LoggerService,
    ErrorMonitoringService,
    ErrorRecoveryService,
  ],
})
export class AppModule {}
