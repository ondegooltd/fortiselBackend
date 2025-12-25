import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { Order, OrderSchema } from '../order/order.schema';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { SharedServicesModule } from '../common/modules/shared-services.module';

@Module({
  imports: [
    SharedServicesModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy, GoogleStrategy],
  exports: [UserService],
})
export class UserModule {}
