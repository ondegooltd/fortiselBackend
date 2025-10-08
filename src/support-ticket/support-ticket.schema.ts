import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SupportTicketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PENDING = 'pending',
}

@Schema({ timestamps: { createdAt: 'createdAt' } })
export class SupportTicket extends Document {
  @Prop({ required: true, unique: true })
  ticketId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: SupportTicketStatus,
    default: SupportTicketStatus.OPEN,
  })
  status: SupportTicketStatus;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
export type SupportTicketDocument = SupportTicket & Document;
