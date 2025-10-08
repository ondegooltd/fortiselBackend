import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export class CreateDeliveryDto {
  @IsMongoId()
  orderId: string;

  @IsMongoId()
  @IsOptional()
  driverId?: string;

  @IsString()
  pickupAddress: string;

  @IsString()
  dropOffAddress: string;

  @IsDateString()
  @IsOptional()
  estimatedPickupTime?: string;

  @IsDateString()
  @IsOptional()
  estimatedDeliveryTime?: string;

  @IsString()
  @IsOptional()
  driverNotes?: string;

  @IsString()
  @IsOptional()
  customerNotes?: string;

  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @IsOptional()
  distance?: number;

  @IsOptional()
  coordinates?: {
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
  };
}
