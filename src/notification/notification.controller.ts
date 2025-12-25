import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.create(createDto);
  }

  @Get('by-user/:userId')
  @UseGuards(JwtAuthGuard)
  findByUserId(@Request() req, @Param('userId') userId: string) {
    // Ensure user can only access their own notifications
    if (req.user.userId !== userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot access other users notifications',
      );
    }
    return this.notificationService.findByUserId(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    // Filter notifications by authenticated user's userId
    // Returns user-specific notifications and broadcast notifications (where userId is null/undefined)
    return this.notificationService.findByUserId(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Request() req, @Param('id') id: string) {
    const notification = await this.notificationService.findOne(id);
    // Ensure user can only access their own notifications or broadcast notifications
    if (notification.userId && notification.userId !== req.user.userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot access other users notifications',
      );
    }
    return notification;
  }

  @Patch('mark-all-read')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationService.findOne(id);
    // Ensure user can only update their own notifications or broadcast notifications
    if (notification.userId && notification.userId !== req.user.userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot update other users notifications',
      );
    }
    return this.notificationService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req, @Param('id') id: string) {
    const notification = await this.notificationService.findOne(id);
    // Ensure user can only delete their own notifications or broadcast notifications
    if (notification.userId && notification.userId !== req.user.userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot delete other users notifications',
      );
    }
    return this.notificationService.remove(id);
  }
}
