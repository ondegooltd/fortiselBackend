import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaystackService } from './paystack.service';
import { Payment, PaymentSchema } from './payment.schema';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import { LoggerService } from '../common/services/logger.service';
import { OrderModule } from '../order/order.module';

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
    SmsService,
    LoggerService,
  ],
  exports: [PaymentService, PaystackService],
})
export class PaymentModule {}
