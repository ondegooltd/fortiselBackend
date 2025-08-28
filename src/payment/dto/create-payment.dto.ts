import { IsString, IsNumber, IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { PaymentProvider, PaymentMethod } from '../payment.schema';

export class CreatePaymentDto {
  @IsMongoId()
  orderId: string;

  @IsMongoId()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider; // 'paystack' for electronic, 'cash' for offline

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
} 