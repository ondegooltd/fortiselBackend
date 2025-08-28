import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum CylinderSize {
  SMALLEST = 'smallest',
  SMALL = 'small',
  MEDIUM = 'medium',
  BIG = 'big',
  LARGE = 'large',
  COMMERCIAL = 'commercial',
}

@Schema({ timestamps: { createdAt: 'createdAt' } })
export class Cylinder extends Document {
  @Prop({ required: true, unique: true })
  cylinderId: string;

  @Prop({ type: String, enum: CylinderSize, required: true })
  size: CylinderSize;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ required: true })
  description: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CylinderSchema = SchemaFactory.createForClass(Cylinder);
export type CylinderDocument = Cylinder & Document; 