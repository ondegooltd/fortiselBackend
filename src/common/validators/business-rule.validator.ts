import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../../order/order.schema';
import { User, UserDocument } from '../../user/user.schema';
import { Cylinder, CylinderDocument } from '../../cylinder/cylinder.schema';
import { Payment, PaymentDocument } from '../../payment/payment.schema';
import { LoggerService } from '../services/logger.service';

export interface BusinessRuleResult {
  isValid: boolean;
  violations: string[];
  warnings?: string[];
}

export interface OrderValidationContext {
  userId: string;
  orderId?: string;
  cylinderSize: string;
  quantity: number;
  scheduledDate: Date;
  deliveryAddress: string;
}

export interface PaymentValidationContext {
  orderId: string;
  amount: number;
  paymentMethod: string;
  userId: string;
}

@Injectable()
export class BusinessRuleValidator {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Cylinder.name) private cylinderModel: Model<CylinderDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Validate order creation business rules
   */
  async validateOrderCreation(
    context: OrderValidationContext,
  ): Promise<BusinessRuleResult> {
    const violations: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. User must exist and be active
      const user = await this.userModel
        .findOne({ userId: context.userId })
        .exec();
      if (!user) {
        violations.push('User not found');
      } else if (!user.isActive) {
        violations.push('User account is inactive');
      }

      // 2. Check if user has pending orders
      const pendingOrders = await this.orderModel
        .countDocuments({
          userId: context.userId,
          status: { $in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
        })
        .exec();

      if (pendingOrders > 0) {
        warnings.push('User has pending orders');
      }

      // 3. Validate cylinder availability
      const availableCylinders = await this.cylinderModel
        .countDocuments({
          size: context.cylinderSize,
          status: 'AVAILABLE',
        })
        .exec();

      if (availableCylinders < context.quantity) {
        violations.push(
          `Insufficient cylinders available. Requested: ${context.quantity}, Available: ${availableCylinders}`,
        );
      }

      // 4. Validate scheduled date (must be in the future)
      const now = new Date();
      if (context.scheduledDate <= now) {
        violations.push('Scheduled date must be in the future');
      }

      // 5. Check for duplicate orders (same user, same day)
      const startOfDay = new Date(context.scheduledDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(context.scheduledDate);
      endOfDay.setHours(23, 59, 59, 999);

      const duplicateOrders = await this.orderModel
        .countDocuments({
          userId: context.userId,
          scheduledDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
        })
        .exec();

      if (duplicateOrders > 0) {
        violations.push('User already has an order scheduled for this date');
      }

      // 6. Validate delivery address format
      if (
        !context.deliveryAddress ||
        context.deliveryAddress.trim().length < 10
      ) {
        violations.push('Delivery address must be at least 10 characters long');
      }

      // 7. Check order limits per user
      const userOrderCount = await this.orderModel
        .countDocuments({
          userId: context.userId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        })
        .exec();

      if (userOrderCount >= 10) {
        violations.push(
          'User has reached the maximum order limit (10 orders per month)',
        );
      }

      this.loggerService.log('Order creation validation completed', {
        userId: context.userId,
        violations: violations.length,
        warnings: warnings.length,
        type: 'business_rule_validation',
      });

      return {
        isValid: violations.length === 0,
        violations,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.loggerService.logError(error as Error, {
        context: 'order_creation_validation',
        userId: context.userId,
        type: 'business_rule_validation_error',
      });

      return {
        isValid: false,
        violations: ['Validation error occurred'],
      };
    }
  }

  /**
   * Validate payment business rules
   */
  async validatePayment(
    context: PaymentValidationContext,
  ): Promise<BusinessRuleResult> {
    const violations: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Order must exist and be in valid state for payment
      const order = await this.orderModel
        .findOne({ orderId: context.orderId })
        .exec();
      if (!order) {
        violations.push('Order not found');
      } else if (order.status !== OrderStatus.PENDING) {
        violations.push(
          `Order is not in a valid state for payment. Current status: ${order.status}`,
        );
      }

      // 2. Validate payment amount matches order total
      if (order && Math.abs(order.totalAmount - context.amount) > 0.01) {
        violations.push(
          `Payment amount (${context.amount}) does not match order total (${order.totalAmount})`,
        );
      }

      // 3. Check for duplicate payments
      const existingPayment = await this.paymentModel
        .findOne({
          orderId: context.orderId,
          status: { $in: ['SUCCESSFUL', 'PROCESSING'] },
        })
        .exec();

      if (existingPayment) {
        violations.push('Payment already exists for this order');
      }

      // 4. Validate payment method
      const validPaymentMethods = ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'];
      if (!validPaymentMethods.includes(context.paymentMethod)) {
        violations.push(`Invalid payment method: ${context.paymentMethod}`);
      }

      // 5. Check user payment history for fraud detection
      const recentPayments = await this.paymentModel
        .countDocuments({
          userId: context.userId,
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
          status: 'SUCCESSFUL',
        })
        .exec();

      if (recentPayments >= 5) {
        warnings.push('User has made multiple payments in the last hour');
      }

      this.loggerService.log('Payment validation completed', {
        orderId: context.orderId,
        userId: context.userId,
        violations: violations.length,
        warnings: warnings.length,
        type: 'business_rule_validation',
      });

      return {
        isValid: violations.length === 0,
        violations,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.loggerService.logError(error as Error, {
        context: 'payment_validation',
        orderId: context.orderId,
        type: 'business_rule_validation_error',
      });

      return {
        isValid: false,
        violations: ['Payment validation error occurred'],
      };
    }
  }

  /**
   * Validate user registration business rules
   */
  async validateUserRegistration(userData: {
    email: string;
    phone: string;
    name: string;
  }): Promise<BusinessRuleResult> {
    const violations: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Check for duplicate email
      const existingEmail = await this.userModel
        .findOne({ email: userData.email })
        .exec();
      if (existingEmail) {
        violations.push('Email already registered');
      }

      // 2. Check for duplicate phone
      const existingPhone = await this.userModel
        .findOne({ phone: userData.phone })
        .exec();
      if (existingPhone) {
        violations.push('Phone number already registered');
      }

      // 3. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        violations.push('Invalid email format');
      }

      // 4. Validate phone format (Ghana phone numbers)
      const phoneRegex = /^(\+233|0)[2-9]\d{8}$/;
      if (!phoneRegex.test(userData.phone)) {
        violations.push('Invalid phone number format');
      }

      // 5. Validate name format
      if (!userData.name || userData.name.trim().length < 2) {
        violations.push('Name must be at least 2 characters long');
      }

      // 6. Check for suspicious patterns
      if (
        userData.name.toLowerCase().includes('test') ||
        userData.name.toLowerCase().includes('admin')
      ) {
        warnings.push('Suspicious name pattern detected');
      }

      this.loggerService.log('User registration validation completed', {
        email: userData.email,
        violations: violations.length,
        warnings: warnings.length,
        type: 'business_rule_validation',
      });

      return {
        isValid: violations.length === 0,
        violations,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.loggerService.logError(error as Error, {
        context: 'user_registration_validation',
        type: 'business_rule_validation_error',
      });

      return {
        isValid: false,
        violations: ['User registration validation error occurred'],
      };
    }
  }

  /**
   * Validate order cancellation business rules
   */
  async validateOrderCancellation(
    orderId: string,
    userId: string,
  ): Promise<BusinessRuleResult> {
    const violations: string[] = [];

    try {
      const order = await this.orderModel.findOne({ orderId, userId }).exec();
      if (!order) {
        violations.push('Order not found or access denied');
      } else if (order.status === OrderStatus.DELIVERED) {
        violations.push('Cannot cancel delivered order');
      } else if (order.status === OrderStatus.CANCELLED) {
        violations.push('Order is already cancelled');
      } else if (order.status === OrderStatus.IN_TRANSIT) {
        violations.push('Cannot cancel order that is in transit');
      }

      // Check if cancellation is within allowed time window (e.g., 2 hours before delivery)
      if (order && order.scheduledDate) {
        const now = new Date();
        const scheduledDate = new Date(order.scheduledDate);
        const timeDiff = scheduledDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 2) {
          violations.push(
            'Cannot cancel order less than 2 hours before scheduled delivery',
          );
        }
      }

      this.loggerService.log('Order cancellation validation completed', {
        orderId,
        userId,
        violations: violations.length,
        type: 'business_rule_validation',
      });

      return {
        isValid: violations.length === 0,
        violations,
      };
    } catch (error) {
      this.loggerService.logError(error as Error, {
        context: 'order_cancellation_validation',
        orderId,
        type: 'business_rule_validation_error',
      });

      return {
        isValid: false,
        violations: ['Order cancellation validation error occurred'],
      };
    }
  }
}
