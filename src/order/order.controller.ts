import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Create a new order
   * Accepts: cylinderSize, quantity, refillAmount, deliveryFee, totalAmount, pickupAddress, dropOffAddress, receiverName, receiverPhone, paymentMethod, notes, status (optional), scheduledDate (optional), scheduledTime (optional)
   */
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get('by-order-id/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.orderService.findByOrderId(orderId);
  }

  /**
   * Update an order
   * Accepts any updatable field: cylinderSize, quantity, refillAmount, deliveryFee, totalAmount, pickupAddress, dropOffAddress, receiverName, receiverPhone, paymentMethod, notes, status, scheduledDate, scheduledTime
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
