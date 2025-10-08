import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Notification extends Document {
  @Prop({ required: true })
  notificationId: string;

  @Prop({ required: false })
  userId: string; // null or undefined for broadcast

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  type: string; // e.g., 'order', 'promo', 'system'

  @Prop()
  orderId: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  scheduledAt: Date;

  @Prop({ default: false })
  sent: boolean;

  @Prop({ type: Object })
  meta: any;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
export type NotificationDocument = Notification & Document;
