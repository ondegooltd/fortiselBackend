import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaystackService } from './paystack.service';
import { Payment, PaymentSchema } from './payment.schema';
import { EmailService } from '../common/services/email.service';
import { LoggerService } from '../common/services/logger.service';
import { OrderModule } from '../order/order.module';
import { TwilioSmsService } from 'src/common/services/twilio.sms.service';
import { MnotifySmsService } from 'src/common/services/mnotify.sms.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    OrderModule,
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentService,
    PaystackService,
    EmailService,
    TwilioSmsService,
    MnotifySmsService,
    LoggerService,
  ],
  exports: [PaymentService, PaystackService],
})
export class PaymentModule {}
