import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Length,
  Matches,
  IsPhoneNumber,
  IsNotEmpty,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { UserRole, AuthProvider, OtpDeliveryMethod } from '../user.schema';
import { IsStrongPassword } from '../../common/decorators/password-strength.decorator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Length(5, 100, { message: 'Email must be between 5 and 100 characters' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @IsStrongPassword({ message: 'Password does not meet strength requirements' })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(AuthProvider)
  @IsOptional()
  authProvider?: AuthProvider;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  googleId?: string;

  @IsString()
  @IsOptional()
  @Length(1, 500)
  @Matches(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i, {
    message: 'Profile picture must be a valid image URL',
  })
  profilePicture?: string;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  lastLoginAt?: Date;

  @IsString()
  @IsOptional()
  @Length(1, 500)
  refreshToken?: string;

  @IsString()
  @IsOptional()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp?: string;

  @IsDateString()
  @IsOptional()
  otpExpiresAt?: Date;

  @IsEnum(OtpDeliveryMethod)
  @IsOptional()
  otpDeliveryMethod?: OtpDeliveryMethod;
}
