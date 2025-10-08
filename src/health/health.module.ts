import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { LoggerService } from '../common/services/logger.service';

@Module({
  imports: [MongooseModule],
  controllers: [HealthController],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class HealthModule {}
