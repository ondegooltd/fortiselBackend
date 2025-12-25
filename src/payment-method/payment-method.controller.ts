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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { ApiVersion } from '../common/decorators/api-version.decorator';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@ApiVersion('v1')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
  ) {
    // Add userId from JWT token
    createPaymentMethodDto.userId = req.user.userId;
    return this.paymentMethodService.create(createPaymentMethodDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.paymentMethodService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.paymentMethodService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(
      id,
      updatePaymentMethodDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.paymentMethodService.remove(id, req.user.userId);
  }

  @Patch(':id/set-default')
  async setDefault(@Request() req, @Param('id') id: string) {
    return this.paymentMethodService.setDefault(id, req.user.userId);
  }
}
