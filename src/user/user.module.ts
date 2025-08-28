import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserController, JwtStrategy, GoogleStrategy],
  exports: [UserService],
})
export class UserModule {} 