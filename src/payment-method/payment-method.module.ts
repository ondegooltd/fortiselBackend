import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethodController } from './payment-method.controller';
import { PaymentMethod, PaymentMethodSchema } from './payment-method.schema';
import { SharedServicesModule } from '../common/modules/shared-services.module';
import { User, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    SharedServicesModule,
    MongooseModule.forFeature([
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PaymentMethodController],
  providers: [PaymentMethodService],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule {}
