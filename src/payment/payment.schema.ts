import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  CASH = 'cash', // For offline cash payments
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Payment extends Document {
  @Prop({ required: true, unique: true })
  paymentId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: String, enum: PaymentProvider, required: true })
  provider: PaymentProvider; // 'paystack' for electronic, 'cash' for offline

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop()
  providerReference?: string;

  @Prop()
  providerTransactionId?: string;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  failureReason?: string;

  @Prop()
  processedAt?: Date;

  @Prop({ type: Object })
  webhookData?: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
export type PaymentDocument = Payment & Document;
