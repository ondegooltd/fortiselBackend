import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  PaymentStatus,
  PaymentProvider,
  PaymentMethod,
} from './payment.schema';
import { OrderService } from '../order/order.service';
import { PaystackService } from './paystack.service';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    // Resolve custom orderId (ORD-xxx) to MongoDB _id
    let orderMongoId: string;

    // Check if orderId is a MongoDB ObjectId or custom format
    if (/^[0-9a-fA-F]{24}$/.test(createPaymentDto.orderId)) {
      // It's already a MongoDB ObjectId
      orderMongoId = createPaymentDto.orderId;
    } else {
      // It's a custom orderId (ORD-xxx), look up the order
      const order = await this.orderService.findByOrderId(
        createPaymentDto.orderId,
      );
      if (!order) {
        throw new NotFoundException(
          `Order with orderId ${createPaymentDto.orderId} not found`,
        );
      }
      // Get MongoDB _id from the order document
      orderMongoId = (order as any)._id?.toString() || (order as any).id;
      if (!orderMongoId) {
        throw new NotFoundException(
          `Order with orderId ${createPaymentDto.orderId} does not have a valid MongoDB _id`,
        );
      }
    }

    // Extract MongoDB _id from JWT token (sub is the MongoDB _id, userId is custom string)
    // If userId is provided in DTO, it might be a MongoDB ObjectId or custom string
    let userMongoId: string;
    if (createPaymentDto.userId) {
      // Check if it's already a MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(createPaymentDto.userId)) {
        userMongoId = createPaymentDto.userId;
      } else {
        // It's a custom userId, use JWT token's sub (MongoDB _id)
        userMongoId = req.user?.sub;
      }
    } else {
      // Use MongoDB _id from JWT token
      userMongoId = req.user?.sub;
    }

    if (!userMongoId) {
      throw new BadRequestException('User ID is required');
    }

    // Create payment with MongoDB ObjectId
    return this.paymentService.create({
      ...createPaymentDto,
      orderId: orderMongoId,
      userId: userMongoId,
    });
  }

  @Post('initialize/paystack')
  @UseGuards(JwtAuthGuard)
  async initializePaystack(
    @Body() body: { orderId: string; email: string; amount: number },
    @Request() req,
  ) {
    // Resolve custom orderId (ORD-xxx) to MongoDB _id
    let orderMongoId: string;

    // Check if orderId is a MongoDB ObjectId or custom format
    if (/^[0-9a-fA-F]{24}$/.test(body.orderId)) {
      orderMongoId = body.orderId;
    } else {
      const order = await this.orderService.findByOrderId(body.orderId);
      if (!order) {
        throw new NotFoundException(
          `Order with orderId ${body.orderId} not found`,
        );
      }
      orderMongoId = (order as any)._id?.toString() || (order as any).id;
      if (!orderMongoId) {
        throw new NotFoundException(
          `Order with orderId ${body.orderId} does not have a valid MongoDB _id`,
        );
      }
    }

    // Extract MongoDB _id from JWT token (sub is the MongoDB _id, userId is custom string)
    const userMongoId = req.user?.sub;
    if (!userMongoId) {
      throw new BadRequestException('User ID is required');
    }

    // Create payment record first
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const payment = await this.paymentService.create({
      orderId: orderMongoId,
      userId: userMongoId, // Use MongoDB _id from JWT token (sub)
      amount: body.amount,
      currency: 'GHS',
      provider: PaymentProvider.PAYSTACK,
      paymentMethod: PaymentMethod.CARD,
      metadata: {
        orderId: body.orderId,
      },
    });

    // Initialize Paystack payment
    const reference = payment.paymentId;
    const paystackResult = await this.paystackService.initializePayment({
      email: body.email,
      amount: body.amount,
      reference: reference,
      metadata: {
        paymentId: payment.paymentId,
        orderId: body.orderId,
        userId: req.user?.userId || userMongoId, // Include custom userId in metadata for reference
      },
    });

    // Update payment with provider reference
    const paymentDoc = payment as any;
    await this.paymentService.update(
      paymentDoc._id?.toString() || paymentDoc.id,
      {
        providerReference: reference,
      } as any,
    );

    return {
      authorization_url: paystackResult.authorization_url,
      access_code: paystackResult.access_code,
      reference: paystackResult.reference,
      paymentId: payment.paymentId,
    };
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
