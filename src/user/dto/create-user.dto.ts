import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole, AuthProvider, OtpDeliveryMethod } from '../user.schema';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(AuthProvider)
  @IsOptional()
  authProvider?: AuthProvider;

  @IsString()
  @IsOptional()
  googleId?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsOptional()
  isEmailVerified?: boolean;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  lastLoginAt?: Date;

  @IsOptional()
  refreshToken?: string;

  @IsString()
  @IsOptional()
  otp?: string;

  @IsOptional()
  otpExpiresAt?: Date;

  @IsEnum(OtpDeliveryMethod)
  @IsOptional()
  otpDeliveryMethod?: OtpDeliveryMethod;
} 