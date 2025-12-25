import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Length,
  Matches,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { UserRole, AuthProvider } from '../user.schema';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  name?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @Length(5, 100, { message: 'Email must be between 5 and 100 characters' })
  email?: string;

  @IsString()
  @IsOptional()
  @Length(10, 15, {
    message: 'Phone number must be between 10 and 15 characters',
  })
  @Matches(/^[0-9+\-\s()]+$/, {
    message:
      'Phone number can only contain digits, +, -, spaces, and parentheses',
  })
  phone?: string;

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

  @IsString()
  @IsOptional()
  @Length(1, 500)
  refreshToken?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(AuthProvider)
  @IsOptional()
  authProvider?: AuthProvider;

  @IsObject()
  @IsOptional()
  notificationPreferences?: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
  };

  @IsBoolean()
  @IsOptional()
  locationServices?: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  address?: string;
}
