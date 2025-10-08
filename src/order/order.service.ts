import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument, OrderStatus } from './order.schema';
import { Transaction } from '../common/decorators/transaction.decorator';
import { BusinessRule } from '../common/decorators/business-rule.decorator';
import { TransactionService } from '../common/services/transaction.service';
import { BusinessRuleValidator } from '../common/validators/business-rule.validator';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly transactionService: TransactionService,
    private readonly businessRuleValidator: BusinessRuleValidator,
  ) {}

  @Transaction({ timeout: 30000, retries: 3 })
  @BusinessRule(['order'])
  async create(
    createOrderDto: CreateOrderDto,
  ): Promise<BaseResponseDto<Order>> {
    // Validate business rules before creating order
    const validationResult =
      await this.businessRuleValidator.validateOrderCreation({
        userId: 'temp-user-id', // TODO: Get from authenticated user
        orderId: undefined,
        cylinderSize: createOrderDto.cylinderSize,
        quantity: createOrderDto.quantity || 1,
        scheduledDate: createOrderDto.scheduledDate
          ? new Date(createOrderDto.scheduledDate)
          : new Date(),
        deliveryAddress:
          createOrderDto.dropOffAddress || createOrderDto.pickupAddress || '',
      });

    if (!validationResult.isValid) {
      throw new Error(
        `Business rule validation failed: ${validationResult.violations.join(', ')}`,
      );
    }

    // Execute order creation within transaction
    const result = await this.transactionService.executeTransaction(
      async (session) => {
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const status = createOrderDto.status || OrderStatus.PENDING;

        const createdOrder = new this.orderModel({
          ...createOrderDto,
          orderId,
          status,
          updatedAt: new Date(),
        });

        return createdOrder.save({ session });
      },
    );

    if (!result.success) {
      throw result.error || new Error('Failed to create order');
    }

    return BaseResponseDto.success(result.data!, 'Order created successfully');
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
    if (status && !Object.values(OrderStatus).includes(status as any)) {
      status = OrderStatus.PENDING as any;
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

  async updateStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.orderModel
      .findOneAndUpdate(
        { orderId },
        { status, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
