import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMethod, PaymentMethodDocument } from './payment-method.schema';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectModel(PaymentMethod.name)
    private paymentMethodModel: Model<PaymentMethodDocument>,
    private logger: LoggerService,
  ) {}

  async create(
    createPaymentMethodDto: CreatePaymentMethodDto,
  ): Promise<BaseResponseDto<PaymentMethod>> {
    try {
      // If this is set as default, unset other default methods for this user
      if (createPaymentMethodDto.isDefault) {
        await this.paymentMethodModel.updateMany(
          { userId: createPaymentMethodDto.userId, isDefault: true },
          { isDefault: false },
        );
      }

      const paymentMethod = new this.paymentMethodModel({
        ...createPaymentMethodDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedPaymentMethod = await paymentMethod.save();

      this.logger.log(`Payment method created: ${savedPaymentMethod._id}`, {
        context: 'PaymentMethodService',
        userId: createPaymentMethodDto.userId,
        type: createPaymentMethodDto.type,
      });

      return BaseResponseDto.success(
        savedPaymentMethod,
        'Payment method created successfully',
      );
    } catch (error) {
      this.logger.error('Failed to create payment method', error, {
        context: 'PaymentMethodService',
        userId: createPaymentMethodDto.userId,
      });
      throw new BadRequestException('Failed to create payment method');
    }
  }

  async findAll(userId: string): Promise<BaseResponseDto<PaymentMethod[]>> {
    try {
      const paymentMethods = await this.paymentMethodModel
        .find({ userId, isActive: true })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();

      return BaseResponseDto.success(
        paymentMethods,
        'Payment methods retrieved successfully',
      );
    } catch (error) {
      this.logger.error('Failed to retrieve payment methods', error, {
        context: 'PaymentMethodService',
        userId,
      });
      throw new BadRequestException('Failed to retrieve payment methods');
    }
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<BaseResponseDto<PaymentMethod>> {
    try {
      const paymentMethod = await this.paymentMethodModel
        .findOne({ _id: id, userId, isActive: true })
        .exec();

      if (!paymentMethod) {
        throw new NotFoundException('Payment method not found');
      }

      return BaseResponseDto.success(
        paymentMethod,
        'Payment method retrieved successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to retrieve payment method', error, {
        context: 'PaymentMethodService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to retrieve payment method');
    }
  }

  async update(
    id: string,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
    userId: string,
  ): Promise<BaseResponseDto<PaymentMethod>> {
    try {
      // If this is set as default, unset other default methods for this user
      if (updatePaymentMethodDto.isDefault) {
        await this.paymentMethodModel.updateMany(
          { userId, isDefault: true, _id: { $ne: id } },
          { isDefault: false },
        );
      }

      const updatedPaymentMethod = await this.paymentMethodModel
        .findOneAndUpdate(
          { _id: id, userId, isActive: true },
          { ...updatePaymentMethodDto, updatedAt: new Date() },
          { new: true },
        )
        .exec();

      if (!updatedPaymentMethod) {
        throw new NotFoundException('Payment method not found');
      }

      this.logger.log(`Payment method updated: ${id}`, {
        context: 'PaymentMethodService',
        userId,
      });

      return BaseResponseDto.success(
        updatedPaymentMethod,
        'Payment method updated successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to update payment method', error, {
        context: 'PaymentMethodService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to update payment method');
    }
  }

  async remove(id: string, userId: string): Promise<BaseResponseDto<any>> {
    try {
      const result = await this.paymentMethodModel
        .findOneAndUpdate(
          { _id: id, userId, isActive: true },
          { isActive: false, updatedAt: new Date() },
          { new: true },
        )
        .exec();

      if (!result) {
        throw new NotFoundException('Payment method not found');
      }

      this.logger.log(`Payment method deleted: ${id}`, {
        context: 'PaymentMethodService',
        userId,
      });

      return BaseResponseDto.success(
        null,
        'Payment method deleted successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to delete payment method', error, {
        context: 'PaymentMethodService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to delete payment method');
    }
  }

  async setDefault(
    id: string,
    userId: string,
  ): Promise<BaseResponseDto<PaymentMethod>> {
    try {
      // First, unset all default methods for this user
      await this.paymentMethodModel.updateMany(
        { userId, isDefault: true },
        { isDefault: false },
      );

      // Then set the specified method as default
      const updatedPaymentMethod = await this.paymentMethodModel
        .findOneAndUpdate(
          { _id: id, userId, isActive: true },
          { isDefault: true, updatedAt: new Date() },
          { new: true },
        )
        .exec();

      if (!updatedPaymentMethod) {
        throw new NotFoundException('Payment method not found');
      }

      this.logger.log(`Payment method set as default: ${id}`, {
        context: 'PaymentMethodService',
        userId,
      });

      return BaseResponseDto.success(
        updatedPaymentMethod,
        'Payment method set as default successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to set default payment method', error, {
        context: 'PaymentMethodService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to set default payment method');
    }
  }
}
