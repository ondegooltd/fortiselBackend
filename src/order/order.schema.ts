import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  PAYMENT_FAILED = 'payment_failed',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Order extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  cylinderSize: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  refillAmount: number;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop()
  pickupAddress: string;

  @Prop()
  dropOffAddress: string;

  @Prop()
  receiverName: string;

  @Prop()
  receiverPhone: string;

  @Prop()
  paymentMethod: string;

  @Prop()
  notes: string;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop()
  scheduledDate?: Date;

  @Prop()
  scheduledTime?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export type OrderDocument = Order & Document;
