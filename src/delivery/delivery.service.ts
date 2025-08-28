import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Delivery, DeliveryDocument, DeliveryStatus } from './delivery.schema';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const deliveryId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdDelivery = new this.deliveryModel({
      ...createDeliveryDto,
      deliveryId,
      status: DeliveryStatus.PENDING,
    });

    return createdDelivery.save();
  }

  async findAll(): Promise<Delivery[]> {
    return this.deliveryModel.find().exec();
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryModel.findById(id).exec();
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return delivery;
  }

  async findByOrderId(orderId: string): Promise<Delivery[]> {
    return this.deliveryModel.find({ orderId }).exec();
  }

  async findByDriverId(driverId: string): Promise<Delivery[]> {
    return this.deliveryModel.find({ driverId }).exec();
  }

  async findByStatus(status: DeliveryStatus): Promise<Delivery[]> {
    return this.deliveryModel.find({ status }).exec();
  }

  async update(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery> {
    const updatedDelivery = await this.deliveryModel
      .findByIdAndUpdate(id, updateDeliveryDto, { new: true })
      .exec();

    if (!updatedDelivery) {
      throw new NotFoundException('Delivery not found');
    }

    return updatedDelivery;
  }

  async updateStatus(id: string, status: DeliveryStatus): Promise<Delivery> {
    const updateData: any = { status };
    
    // Update timestamps based on status
    switch (status) {
      case DeliveryStatus.PICKED_UP:
        updateData.actualPickupTime = new Date();
        break;
      case DeliveryStatus.DELIVERED:
        updateData.actualDeliveryTime = new Date();
        break;
    }

    const updatedDelivery = await this.deliveryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedDelivery) {
      throw new NotFoundException('Delivery not found');
    }

    return updatedDelivery;
  }

  async assignDriver(id: string, driverId: string): Promise<Delivery> {
    const updatedDelivery = await this.deliveryModel
      .findByIdAndUpdate(
        id,
        { 
          driverId,
          status: DeliveryStatus.ASSIGNED,
        },
        { new: true }
      )
      .exec();

    if (!updatedDelivery) {
      throw new NotFoundException('Delivery not found');
    }

    return updatedDelivery;
  }

  async remove(id: string): Promise<void> {
    const result = await this.deliveryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Delivery not found');
    }
  }

  async getPendingDeliveries(): Promise<Delivery[]> {
    return this.deliveryModel.find({ status: DeliveryStatus.PENDING }).exec();
  }

  async getDriverDeliveries(driverId: string): Promise<Delivery[]> {
    return this.deliveryModel.find({ driverId }).exec();
  }
} 