import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class TwoFactorAuth extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  secret: string;

  @Prop({ required: true })
  backupCodes: string[];

  @Prop({ default: false })
  isEnabled: boolean;

  @Prop()
  lastUsed?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TwoFactorAuthSchema = SchemaFactory.createForClass(TwoFactorAuth);
export type TwoFactorAuthDocument = TwoFactorAuth & Document;
