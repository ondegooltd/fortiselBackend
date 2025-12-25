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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiVersion } from '../common/decorators/api-version.decorator';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@Controller('orders')
@ApiVersion('v1')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Create a new order
   * Accepts: cylinderSize, quantity, refillAmount, deliveryFee, totalAmount, pickupAddress, dropOffAddress, receiverName, receiverPhone, paymentMethod, notes, status (optional), scheduledDate (optional), scheduledTime (optional)
   */
  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    // Add userId from JWT token
    createOrderDto.userId = req.user.userId;
    return this.orderService.create(createOrderDto);
  }

  @Get('by-user/:userId')
  findByUserId(@Request() req, @Param('userId') userId: string) {
    // Ensure user can only access their own orders
    if (req.user.userId !== userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot access other users orders',
      );
    }
    return this.orderService.findByUserId(userId);
  }

  @Get('by-order-id/:orderId')
  async findByOrderId(@Request() req, @Param('orderId') orderId: string) {
    const order = await this.orderService.findByOrderId(orderId);
    // Ensure user can only access their own orders
    if (order.userId !== req.user.userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot access other users orders',
      );
    }
    return order;
  }

  @Get()
  findAll(@Request() req) {
    // Filter orders by authenticated user's userId
    return this.orderService.findByUserId(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const order = await this.orderService.findOne(id);
    // Ensure user can only access their own orders
    if (order.userId !== req.user.userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot access other users orders',
      );
    }
    return order;
  }

  /**
   * Update an order
   * Accepts any updatable field: cylinderSize, quantity, refillAmount, deliveryFee, totalAmount, pickupAddress, dropOffAddress, receiverName, receiverPhone, paymentMethod, notes, status, scheduledDate, scheduledTime
   */
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    const order = await this.orderService.findOne(id);
    // Ensure user can only update their own orders
    if (order.userId !== req.user.userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot update other users orders',
      );
    }
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const order = await this.orderService.findOne(id);
    // Ensure user can only delete their own orders
    if (order.userId !== req.user.userId) {
      throw new ForbiddenException(
        'Unauthorized: Cannot delete other users orders',
      );
    }
    return this.orderService.remove(id);
  }
}
