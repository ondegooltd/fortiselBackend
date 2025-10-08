import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveryStatus } from './delivery.schema';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  create(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveryService.create(createDeliveryDto);
  }

  @Get()
  findAll() {
    return this.deliveryService.findAll();
  }

  @Get('pending')
  getPendingDeliveries() {
    return this.deliveryService.getPendingDeliveries();
  }

  @Get('by-order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.deliveryService.findByOrderId(orderId);
  }

  @Get('by-driver/:driverId')
  findByDriverId(@Param('driverId') driverId: string) {
    return this.deliveryService.findByDriverId(driverId);
  }

  @Get('by-status')
  findByStatus(@Query('status') status: DeliveryStatus) {
    return this.deliveryService.findByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
  ) {
    return this.deliveryService.update(id, updateDeliveryDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: DeliveryStatus },
  ) {
    return this.deliveryService.updateStatus(id, body.status);
  }

  @Patch(':id/assign-driver')
  assignDriver(@Param('id') id: string, @Body() body: { driverId: string }) {
    return this.deliveryService.assignDriver(id, body.driverId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliveryService.remove(id);
  }
}
