import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseConnectionService } from './connection.service';
import { BackupService } from './backup.service';
import { LoggerService } from '../common/services/logger.service';

@Module({
  imports: [MongooseModule],
  providers: [DatabaseConnectionService, BackupService, LoggerService],
  exports: [DatabaseConnectionService, BackupService, LoggerService],
})
export class DatabaseModule {}
