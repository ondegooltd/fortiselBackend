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
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from './payment.schema';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Post('webhook/paystack')
  async paystackWebhook(@Body() webhookData: any) {
    const { reference } = webhookData.data;
    return this.paymentService.processWebhook(reference, webhookData);
  }

  @Post('webhook/momo')
  async momoWebhook(@Body() webhookData: any) {
    const { reference } = webhookData;
    return this.paymentService.processWebhook(reference, webhookData);
  }

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Get('by-order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.paymentService.findByOrderId(orderId);
  }

  @Get('by-user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.paymentService.findByUserId(userId);
  }

  @Get('by-status')
  findByStatus(@Query('status') status: PaymentStatus) {
    return this.paymentService.findByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PaymentStatus; metadata?: any },
  ) {
    return this.paymentService.updateStatus(id, body.status, body.metadata);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }
} 