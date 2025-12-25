import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class DeliveryAddress extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: AddressType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  landmark?: string;

  @Prop()
  instructions?: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DeliveryAddressSchema =
  SchemaFactory.createForClass(DeliveryAddress);
export type DeliveryAddressDocument = DeliveryAddress & Document;
