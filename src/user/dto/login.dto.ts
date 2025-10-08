import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsNotEmpty,
  Length,
  IsPhoneNumber,
  Matches,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @Length(5, 100, { message: 'Email must be between 5 and 100 characters' })
  email?: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phone?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50, { message: 'User ID must be between 1 and 50 characters' })
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password: string;
}
