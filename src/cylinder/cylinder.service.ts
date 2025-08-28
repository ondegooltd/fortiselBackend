import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cylinder, CylinderDocument } from './cylinder.schema';
import { CreateCylinderDto } from './dto/create-cylinder.dto';
import { UpdateCylinderDto } from './dto/update-cylinder.dto';

@Injectable()
export class CylinderService {
  constructor(
    @InjectModel(Cylinder.name) private cylinderModel: Model<CylinderDocument>,
  ) {}

  async create(createCylinderDto: CreateCylinderDto): Promise<Cylinder> {
    const { cylinderId, ...rest } = createCylinderDto;
    const generatedCylinderId = cylinderId || `CYLINDER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const createdCylinder = new this.cylinderModel({
      ...rest,
      cylinderId: generatedCylinderId,
    });
    return createdCylinder.save();
  }

  async findAll(): Promise<Cylinder[]> {
    return this.cylinderModel.find().exec();
  }

  async findOne(id: string): Promise<Cylinder> {
    const cylinder = await this.cylinderModel.findById(id).exec();
    if (!cylinder) {
      throw new NotFoundException('Cylinder not found');
    }
    return cylinder;
  }

  async update(id: string, updateCylinderDto: UpdateCylinderDto): Promise<Cylinder> {
    const updatedCylinder = await this.cylinderModel
      .findByIdAndUpdate(id, updateCylinderDto, { new: true })
      .exec();
    if (!updatedCylinder) {
      throw new NotFoundException('Cylinder not found');
    }
    return updatedCylinder;
  }

  async remove(id: string): Promise<void> {
    const result = await this.cylinderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Cylinder not found');
    }
  }

  async findBySize(size: string): Promise<Cylinder[]> {
    return this.cylinderModel.find({ size }).exec();
  }
} 