import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument, OrderStatus } from './order.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const status = createOrderDto.status || OrderStatus.PENDING;
    const createdOrder = new this.orderModel({
      ...createOrderDto,
      orderId,
      status,
      updatedAt: new Date(),
    });
    return createdOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByOrderId(orderId: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderId }).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    // If status is provided, ensure it's a valid enum value
    let status = updateOrderDto.status;
    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      status = OrderStatus.PENDING;
    }
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        {
          ...updateOrderDto,
          ...(status && { status }),
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException('Order not found');
    }

    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Order not found');
    }
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return this.orderModel
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();
  }

  async getOrdersByCylinderSize(cylinderSize: string): Promise<Order[]> {
    return this.orderModel.find({ cylinderSize }).exec();
  }
}
