import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeliveryAddress,
  DeliveryAddressDocument,
} from './delivery-address.schema';
import { CreateDeliveryAddressDto } from './dto/create-delivery-address.dto';
import { UpdateDeliveryAddressDto } from './dto/update-delivery-address.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class DeliveryAddressService {
  constructor(
    @InjectModel(DeliveryAddress.name)
    private deliveryAddressModel: Model<DeliveryAddressDocument>,
    private logger: LoggerService,
  ) {}

  async create(
    createDeliveryAddressDto: CreateDeliveryAddressDto,
  ): Promise<BaseResponseDto<DeliveryAddress>> {
    try {
      // If this is set as default, unset other default addresses for this user
      if (createDeliveryAddressDto.isDefault) {
        await this.deliveryAddressModel.updateMany(
          { userId: createDeliveryAddressDto.userId, isDefault: true },
          { isDefault: false },
        );
      }

      const deliveryAddress = new this.deliveryAddressModel({
        ...createDeliveryAddressDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedDeliveryAddress = await deliveryAddress.save();

      this.logger.log(`Delivery address created: ${savedDeliveryAddress._id}`, {
        context: 'DeliveryAddressService',
        userId: createDeliveryAddressDto.userId,
        type: createDeliveryAddressDto.type,
      });

      return BaseResponseDto.success(
        savedDeliveryAddress,
        'Delivery address created successfully',
      );
    } catch (error) {
      this.logger.error('Failed to create delivery address', error, {
        context: 'DeliveryAddressService',
        userId: createDeliveryAddressDto.userId,
      });
      throw new BadRequestException('Failed to create delivery address');
    }
  }

  async findAll(userId: string): Promise<BaseResponseDto<DeliveryAddress[]>> {
    try {
      const deliveryAddresses = await this.deliveryAddressModel
        .find({ userId, isActive: true })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();

      return BaseResponseDto.success(
        deliveryAddresses,
        'Delivery addresses retrieved successfully',
      );
    } catch (error) {
      this.logger.error('Failed to retrieve delivery addresses', error, {
        context: 'DeliveryAddressService',
        userId,
      });
      throw new BadRequestException('Failed to retrieve delivery addresses');
    }
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<BaseResponseDto<DeliveryAddress>> {
    try {
      const deliveryAddress = await this.deliveryAddressModel
        .findOne({ _id: id, userId, isActive: true })
        .exec();

      if (!deliveryAddress) {
        throw new NotFoundException('Delivery address not found');
      }

      return BaseResponseDto.success(
        deliveryAddress,
        'Delivery address retrieved successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to retrieve delivery address', error, {
        context: 'DeliveryAddressService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to retrieve delivery address');
    }
  }

  async update(
    id: string,
    updateDeliveryAddressDto: UpdateDeliveryAddressDto,
    userId: string,
  ): Promise<BaseResponseDto<DeliveryAddress>> {
    try {
      // If this is set as default, unset other default addresses for this user
      if (updateDeliveryAddressDto.isDefault) {
        await this.deliveryAddressModel.updateMany(
          { userId, isDefault: true, _id: { $ne: id } },
          { isDefault: false },
        );
      }

      const updatedDeliveryAddress = await this.deliveryAddressModel
        .findOneAndUpdate(
          { _id: id, userId, isActive: true },
          { ...updateDeliveryAddressDto, updatedAt: new Date() },
          { new: true },
        )
        .exec();

      if (!updatedDeliveryAddress) {
        throw new NotFoundException('Delivery address not found');
      }

      this.logger.log(`Delivery address updated: ${id}`, {
        context: 'DeliveryAddressService',
        userId,
      });

      return BaseResponseDto.success(
        updatedDeliveryAddress,
        'Delivery address updated successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to update delivery address', error, {
        context: 'DeliveryAddressService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to update delivery address');
    }
  }

  async remove(id: string, userId: string): Promise<BaseResponseDto<any>> {
    try {
      const result = await this.deliveryAddressModel
        .findOneAndUpdate(
          { _id: id, userId, isActive: true },
          { isActive: false, updatedAt: new Date() },
          { new: true },
        )
        .exec();

      if (!result) {
        throw new NotFoundException('Delivery address not found');
      }

      this.logger.log(`Delivery address deleted: ${id}`, {
        context: 'DeliveryAddressService',
        userId,
      });

      return BaseResponseDto.success(
        null,
        'Delivery address deleted successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to delete delivery address', error, {
        context: 'DeliveryAddressService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to delete delivery address');
    }
  }

  async setDefault(
    id: string,
    userId: string,
  ): Promise<BaseResponseDto<DeliveryAddress>> {
    try {
      // First, unset all default addresses for this user
      await this.deliveryAddressModel.updateMany(
        { userId, isDefault: true },
        { isDefault: false },
      );

      // Then set the specified address as default
      const updatedDeliveryAddress = await this.deliveryAddressModel
        .findOneAndUpdate(
          { _id: id, userId, isActive: true },
          { isDefault: true, updatedAt: new Date() },
          { new: true },
        )
        .exec();

      if (!updatedDeliveryAddress) {
        throw new NotFoundException('Delivery address not found');
      }

      this.logger.log(`Delivery address set as default: ${id}`, {
        context: 'DeliveryAddressService',
        userId,
      });

      return BaseResponseDto.success(
        updatedDeliveryAddress,
        'Delivery address set as default successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to set default delivery address', error, {
        context: 'DeliveryAddressService',
        id,
        userId,
      });
      throw new BadRequestException('Failed to set default delivery address');
    }
  }
}
