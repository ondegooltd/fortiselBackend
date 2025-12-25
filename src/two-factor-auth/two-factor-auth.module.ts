import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuthController } from './two-factor-auth.controller';
import { TwoFactorAuth, TwoFactorAuthSchema } from './two-factor-auth.schema';
import { SharedServicesModule } from '../common/modules/shared-services.module';

@Module({
  imports: [
    SharedServicesModule,
    MongooseModule.forFeature([
      { name: TwoFactorAuth.name, schema: TwoFactorAuthSchema },
    ]),
  ],
  controllers: [TwoFactorAuthController],
  providers: [TwoFactorAuthService],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule {}
