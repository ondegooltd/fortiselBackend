import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const { notificationId, ...rest } = createNotificationDto;
    const generatedNotificationId = notificationId || `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const createdNotification = new this.notificationModel({
      ...rest,
      notificationId: generatedNotificationId,
    });
    return createdNotification.save();
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationModel.find().exec();
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async update(id: string, updateDto: UpdateNotificationDto): Promise<Notification> {
    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!updatedNotification) {
      throw new NotFoundException('Notification not found');
    }
    return updatedNotification;
  }

  async remove(id: string): Promise<void> {
    const result = await this.notificationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Notification not found');
    }
  }
} 