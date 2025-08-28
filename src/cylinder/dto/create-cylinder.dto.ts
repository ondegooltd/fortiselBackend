import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CylinderSize } from '../cylinder.schema';

export class CreateCylinderDto {
  @IsString()
  @IsOptional()
  cylinderId?: string;

  @IsEnum(CylinderSize)
  size: CylinderSize;

  @IsNumber()
  deliveryFee: number;

  @IsString()
  description: string;

  @IsOptional()
  createdAt?: Date;
} 