import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
  IsObject,
  IsNotEmpty,
} from 'class-validator';

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

export class CreateDeliveryAddressDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(AddressType)
  @IsNotEmpty()
  type: AddressType;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  region: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  @Matches(/^[0-9+\-\s()]+$/, {
    message:
      'Phone number can only contain digits, +, -, spaces, and parentheses',
  })
  phone: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  landmark?: string;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  instructions?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
