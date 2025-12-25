import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryAddressService } from './delivery-address.service';
import { DeliveryAddressController } from './delivery-address.controller';
import {
  DeliveryAddress,
  DeliveryAddressSchema,
} from './delivery-address.schema';
import { SharedServicesModule } from '../common/modules/shared-services.module';
import { User, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    SharedServicesModule,
    MongooseModule.forFeature([
      { name: DeliveryAddress.name, schema: DeliveryAddressSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DeliveryAddressController],
  providers: [DeliveryAddressService],
  exports: [DeliveryAddressService],
})
export class DeliveryAddressModule {}
