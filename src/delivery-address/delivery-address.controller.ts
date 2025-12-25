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
import { DeliveryAddressService } from './delivery-address.service';
import { CreateDeliveryAddressDto } from './dto/create-delivery-address.dto';
import { UpdateDeliveryAddressDto } from './dto/update-delivery-address.dto';
import { ApiVersion } from '../common/decorators/api-version.decorator';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@ApiVersion('v1')
@Controller('delivery-addresses')
@UseGuards(JwtAuthGuard)
export class DeliveryAddressController {
  constructor(
    private readonly deliveryAddressService: DeliveryAddressService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createDeliveryAddressDto: CreateDeliveryAddressDto,
  ) {
    // Add userId from JWT token
    createDeliveryAddressDto.userId = req.user.userId;
    return this.deliveryAddressService.create(createDeliveryAddressDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.deliveryAddressService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.deliveryAddressService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDeliveryAddressDto: UpdateDeliveryAddressDto,
  ) {
    return this.deliveryAddressService.update(
      id,
      updateDeliveryAddressDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.deliveryAddressService.remove(id, req.user.userId);
  }

  @Patch(':id/set-default')
  async setDefault(@Request() req, @Param('id') id: string) {
    return this.deliveryAddressService.setDefault(id, req.user.userId);
  }
}
