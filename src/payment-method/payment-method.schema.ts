import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PaymentMethodType {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class PaymentMethod extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: PaymentMethodType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  number: string;

  @Prop()
  expiryDate?: string;

  @Prop()
  cvv?: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  provider?: string; // e.g., 'MTN', 'Vodafone', 'Visa', 'Mastercard'

  @Prop()
  lastUsed?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
export type PaymentMethodDocument = PaymentMethod & Document;
