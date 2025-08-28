import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(6)
  password: string;
} 