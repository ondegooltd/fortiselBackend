import { IsString, IsOptional, IsBoolean, IsDate, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsOptional()
  notificationId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsDate()
  @IsOptional()
  createdAt?: Date;

  @IsDate()
  @IsOptional()
  updatedAt?: Date;

  @IsDate()
  @IsOptional()
  scheduledAt?: Date;

  @IsBoolean()
  @IsOptional()
  sent?: boolean;

  @IsObject()
  @IsOptional()
  meta?: any;
} 