import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentDocument, PaymentStatus } from './payment.schema';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Convert orderId and userId strings to MongoDB ObjectIds
    const orderId = new Types.ObjectId(createPaymentDto.orderId);
    const userId = createPaymentDto.userId
      ? new Types.ObjectId(createPaymentDto.userId)
      : undefined;

    const createdPayment = new this.paymentModel({
      ...createPaymentDto,
      orderId,
      userId,
      paymentId,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return createdPayment.save();
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find().exec();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentModel.find({ orderId }).exec();
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return this.paymentModel.find({ userId }).exec();
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return this.paymentModel.find({ status }).exec();
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const updatedPayment = await this.paymentModel
      .findByIdAndUpdate(
        id,
        { ...updatePaymentDto, updatedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!updatedPayment) {
      throw new NotFoundException('Payment not found');
    }
    return updatedPayment;
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    metadata?: any,
  ): Promise<Payment> {
    const updateData: any = { status, updatedAt: new Date() };

    if (status === PaymentStatus.SUCCESSFUL) {
      updateData.processedAt = new Date();
    }

    if (metadata) {
      updateData.webhookData = metadata;
    }

    const updatedPayment = await this.paymentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found');
    }

    return updatedPayment;
  }

  async remove(id: string): Promise<void> {
    const result = await this.paymentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Payment not found');
    }
  }

  async processWebhook(
    providerReference: string,
    webhookData: any,
  ): Promise<Payment> {
    const payment = await this.paymentModel
      .findOne({ providerReference })
      .exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment based on webhook data
    const status = this.determineStatusFromWebhook(webhookData);
    return this.updateStatus(payment.id, status, webhookData);
  }

  async findByProviderReference(providerReference: string): Promise<Payment> {
    const payment = await this.paymentModel
      .findOne({ providerReference })
      .exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  private determineStatusFromWebhook(webhookData: any): PaymentStatus {
    // Paystack webhook status mapping
    switch (webhookData.status) {
      case 'success':
        return PaymentStatus.SUCCESSFUL;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'pending':
        return PaymentStatus.PENDING;
      case 'reversed':
        return PaymentStatus.REVERSED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
