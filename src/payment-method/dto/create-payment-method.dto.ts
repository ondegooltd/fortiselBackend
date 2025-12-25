import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export enum PaymentMethodType {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
}

export class CreatePaymentMethodDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  type: PaymentMethodType;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  number: string;

  @ValidateIf((o) => o.expiryDate && o.expiryDate.trim() !== '')
  @IsString()
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Expiry date must be in MM/YY format',
  })
  expiryDate?: string;

  @ValidateIf((o) => o.cvv && o.cvv.trim() !== '')
  @IsString()
  @IsOptional()
  @Length(3, 4)
  cvv?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  lastUsed?: string;
}
