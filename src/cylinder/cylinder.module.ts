import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cylinder, CylinderSchema } from './cylinder.schema';
import { CylinderService } from './cylinder.service';
import { CylinderController } from './cylinder.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cylinder.name, schema: CylinderSchema }])],
  controllers: [CylinderController],
  providers: [CylinderService],
  exports: [CylinderService],
})
export class CylinderModule {} 