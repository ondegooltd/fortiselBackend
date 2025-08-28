import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [OrderModule, UserModule, PaymentModule, DeliveryModule],
  controllers: [AdminController],
})
export class AdminModule {} 