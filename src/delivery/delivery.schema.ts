import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Delivery extends Document {
  @Prop({ required: true, unique: true })
  deliveryId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  driverId?: Types.ObjectId;

  @Prop({ type: String, enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @Prop({ required: true })
  pickupAddress: string;

  @Prop({ required: true })
  dropOffAddress: string;

  @Prop()
  estimatedPickupTime?: Date;

  @Prop()
  estimatedDeliveryTime?: Date;

  @Prop()
  actualPickupTime?: Date;

  @Prop()
  actualDeliveryTime?: Date;

  @Prop()
  driverNotes?: string;

  @Prop()
  customerNotes?: string;

  @Prop()
  trackingNumber?: string;

  @Prop()
  deliveryFee: number;

  @Prop()
  distance?: number;

  @Prop({ type: Object })
  coordinates?: {
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
  };
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
export type DeliveryDocument = Delivery & Document;
