import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsPhoneNumber,
  Min,
  Max,
  Length,
  Matches,
  IsPositive,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum CylinderSize {
  SMALL = '6kg',
  MEDIUM = '12.5kg',
  LARGE = '25kg',
  EXTRA_LARGE = '50kg',
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  orderId?: string;

  @IsEnum(CylinderSize)
  @IsNotEmpty({ message: 'Cylinder size is required' })
  cylinderSize: CylinderSize;

  @IsNumber({}, { message: 'Quantity must be a number' })
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(10, { message: 'Quantity cannot exceed 10' })
  quantity: number;

  @IsNumber({}, { message: 'Refill amount must be a number' })
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  @IsPositive({ message: 'Refill amount must be positive' })
  @Min(0.01, { message: 'Refill amount must be at least 0.01' })
  refillAmount: number;

  @IsNumber({}, { message: 'Delivery fee must be a number' })
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  @Min(0, { message: 'Delivery fee cannot be negative' })
  deliveryFee: number;

  @IsNumber({}, { message: 'Total amount must be a number' })
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  @IsPositive({ message: 'Total amount must be positive' })
  @Min(0.01, { message: 'Total amount must be at least 0.01' })
  totalAmount: number;

  @IsString()
  @IsOptional()
  @Length(10, 200, {
    message: 'Pickup address must be between 10 and 200 characters',
  })
  pickupAddress?: string;

  @IsString()
  @IsOptional()
  @Length(10, 200, {
    message: 'Drop-off address must be between 10 and 200 characters',
  })
  dropOffAddress?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50, {
    message: 'Receiver name must be between 2 and 50 characters',
  })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'Receiver name can only contain letters, spaces, hyphens, and apostrophes',
  })
  receiverName?: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'Receiver phone must be a valid phone number',
  })
  receiverPhone?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  @Length(0, 500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsDateString({}, { message: 'Scheduled date must be a valid date' })
  @IsOptional()
  @ValidateIf((o) => o.scheduledDate !== undefined)
  scheduledDate?: Date;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Scheduled time must be in HH:MM format',
  })
  scheduledTime?: string;

  @IsOptional()
  updatedAt?: Date;
}
