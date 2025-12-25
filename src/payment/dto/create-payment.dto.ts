import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { PaymentProvider, PaymentMethod } from '../payment.schema';

export class CreatePaymentDto {
  @IsString()
  orderId: string; // Can be custom orderId (ORD-xxx) or MongoDB ObjectId - will be resolved to MongoDB _id in controller

  @IsMongoId()
  @IsOptional()
  userId?: string; // Optional - will be extracted from JWT token if not provided

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
