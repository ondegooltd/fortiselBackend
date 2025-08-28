import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  DRIVER = 'driver',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export enum OtpDeliveryMethod {
  SMS = 'sms',
  EMAIL = 'email',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class User extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider: AuthProvider;

  @Prop()
  googleId?: string;

  @Prop()
  profilePicture?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  refreshToken?: string;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop({ type: String, enum: OtpDeliveryMethod, default: OtpDeliveryMethod.SMS })
  otpDeliveryMethod?: OtpDeliveryMethod;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document; 