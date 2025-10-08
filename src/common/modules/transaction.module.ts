import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionService } from '../services/transaction.service';
import { TransactionInterceptor } from '../interceptors/transaction.interceptor';
import { BusinessRuleValidator } from '../validators/business-rule.validator';
import { BusinessRuleInterceptor } from '../interceptors/business-rule.interceptor';
import { Order, OrderSchema } from '../../order/order.schema';
import { User, UserSchema } from '../../user/user.schema';
import { Cylinder, CylinderSchema } from '../../cylinder/cylinder.schema';
import { Payment, PaymentSchema } from '../../payment/payment.schema';
import { LoggerService } from '../services/logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Cylinder.name, schema: CylinderSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  providers: [
    TransactionService,
    TransactionInterceptor,
    BusinessRuleValidator,
    BusinessRuleInterceptor,
    LoggerService,
  ],
  exports: [
    TransactionService,
    TransactionInterceptor,
    BusinessRuleValidator,
    BusinessRuleInterceptor,
  ],
})
export class TransactionModule {}
