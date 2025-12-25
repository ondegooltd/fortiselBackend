import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../services/email.service';
import { LoggerService } from '../services/logger.service';
import { TwilioSmsService } from '../services/twilio.sms.service';
import { MnotifySmsService } from '../services/mnotify.sms.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, LoggerService, TwilioSmsService, MnotifySmsService],
  exports: [EmailService, LoggerService, TwilioSmsService, MnotifySmsService],
})
export class SharedServicesModule {}
