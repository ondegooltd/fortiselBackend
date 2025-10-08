import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { OrderService } from '../order/order.service';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import { createHmac } from 'crypto';
import { PaymentStatus } from './payment.schema';
import { OrderStatus } from 'src/order/order.schema';

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
      international_format_phone: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;

  constructor(
    private configService: ConfigService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {
    this.secretKey = this.configService.get('payment.paystack.secretKey') || '';
    this.publicKey = this.configService.get('payment.paystack.publicKey') || '';

    if (!this.secretKey || !this.publicKey) {
      throw new Error('Paystack configuration is missing');
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = createHmac('sha512', this.secretKey)
      .update(payload, 'utf8')
      .digest('hex');

    return hash === signature;
  }

  /**
   * Process Paystack webhook event
   */
  async processWebhookEvent(event: PaystackWebhookEvent): Promise<void> {
    try {
      this.logger.log(`Processing Paystack webhook event: ${event.event}`, {
        reference: event.data.reference,
        amount: event.data.amount,
        status: event.data.status,
      });

      switch (event.event) {
        case 'charge.success':
          await this.handleSuccessfulPayment(event);
          break;
        case 'charge.failed':
          await this.handleFailedPayment(event);
          break;
        case 'transfer.success':
          await this.handleSuccessfulTransfer(event);
          break;
        case 'transfer.failed':
          await this.handleFailedTransfer(event);
          break;
        case 'subscription.create':
          await this.handleSubscriptionCreated(event);
          break;
        case 'subscription.disable':
          await this.handleSubscriptionDisabled(event);
          break;
        default:
          this.logger.warn(`Unhandled Paystack webhook event: ${event.event}`);
      }
    } catch (error) {
      this.logger.error('Error processing Paystack webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(
    event: PaystackWebhookEvent,
  ): Promise<void> {
    const { data } = event;

    try {
      // Find payment by reference
      const payment = await this.paymentService.findByProviderReference(
        data.reference,
      );
      if (!payment) {
        this.logger.error(`Payment not found for reference: ${data.reference}`);
        return;
      }

      // Update payment status
      await this.paymentService.updateStatus(
        payment.id,
        PaymentStatus.SUCCESSFUL,
        {
          paystackData: data,
          processedAt: new Date(),
          gatewayResponse: data.gateway_response,
          paidAt: data.paid_at,
          authorization: data.authorization,
        },
      );

      // Update order status
      if (payment.orderId) {
        await this.orderService.updateStatus(
          payment.orderId.toString(),
          'CONFIRMED',
        );
      }

      // Send confirmation notifications
      await this.sendPaymentConfirmationNotifications(payment, data);

      this.logger.log(`Payment successful: ${data.reference}`);
    } catch (error) {
      this.logger.error(
        `Error handling successful payment: ${data.reference}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(
    event: PaystackWebhookEvent,
  ): Promise<void> {
    const { data } = event;

    try {
      // Find payment by reference
      const payment = await this.paymentService.findByProviderReference(
        data.reference,
      );
      if (!payment) {
        this.logger.error(`Payment not found for reference: ${data.reference}`);
        return;
      }

      // Update payment status
      await this.paymentService.updateStatus(payment.id, PaymentStatus.FAILED, {
        paystackData: data,
        failureReason: data.gateway_response,
        failedAt: new Date(),
      });

      // Update order status
      if (payment.orderId) {
        await this.orderService.updateStatus(
          payment.orderId.toString(),
          'PAYMENT_FAILED',
        );
      }

      // Send failure notification
      await this.sendPaymentFailureNotification(payment, data);

      this.logger.log(`Payment failed: ${data.reference}`);
    } catch (error) {
      this.logger.error(
        `Error handling failed payment: ${data.reference}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle successful transfer
   */
  private async handleSuccessfulTransfer(
    event: PaystackWebhookEvent,
  ): Promise<void> {
    const { data } = event;

    this.logger.log(`Transfer successful: ${data.reference}`, {
      amount: data.amount,
      recipient: data.metadata?.recipient,
    });

    // Handle transfer success logic here
    // This could be for driver payments, refunds, etc.
  }

  /**
   * Handle failed transfer
   */
  private async handleFailedTransfer(
    event: PaystackWebhookEvent,
  ): Promise<void> {
    const { data } = event;

    this.logger.log(`Transfer failed: ${data.reference}`, {
      amount: data.amount,
      reason: data.gateway_response,
    });

    // Handle transfer failure logic here
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(
    event: PaystackWebhookEvent,
  ): Promise<void> {
    const { data } = event;

    this.logger.log(`Subscription created: ${data.reference}`);

    // Handle subscription creation logic here
  }

  /**
   * Handle subscription disabled
   */
  private async handleSubscriptionDisabled(
    event: PaystackWebhookEvent,
  ): Promise<void> {
    const { data } = event;

    this.logger.log(`Subscription disabled: ${data.reference}`);

    // Handle subscription disable logic here
  }

  /**
   * Send payment confirmation notifications
   */
  private async sendPaymentConfirmationNotifications(
    payment: any,
    paystackData: any,
  ): Promise<void> {
    try {
      // Send email confirmation
      if (payment.userEmail) {
        await this.emailService.sendOrderConfirmationEmail(payment.userEmail, {
          orderId: payment.orderId,
          customerName:
            paystackData.customer?.first_name +
            ' ' +
            paystackData.customer?.last_name,
          cylinderSize: payment.metadata?.cylinderSize || 'Standard',
          scheduledDate: payment.metadata?.scheduledDate || 'TBD',
          totalAmount: paystackData.amount / 100, // Convert from kobo to naira
        });
      }

      // Send SMS confirmation
      if (payment.userPhone) {
        await this.smsService.sendPaymentConfirmationSms(payment.userPhone, {
          orderId: payment.orderId,
          amount: paystackData.amount / 100,
          paymentMethod: paystackData.authorization?.channel || 'Card',
        });
      }
    } catch (error) {
      this.logger.error(
        'Error sending payment confirmation notifications:',
        error,
      );
    }
  }

  /**
   * Send payment failure notification
   */
  private async sendPaymentFailureNotification(
    payment: any,
    paystackData: any,
  ): Promise<void> {
    try {
      // Send email notification
      if (payment.userEmail) {
        await this.emailService.sendEmail({
          to: payment.userEmail,
          subject: 'Payment Failed - Fortisel',
          html: `
            <h2>Payment Failed</h2>
            <p>Your payment for order ${payment.orderId} has failed.</p>
            <p>Reason: ${paystackData.gateway_response}</p>
            <p>Please try again or contact support.</p>
          `,
        });
      }

      // Send SMS notification
      if (payment.userPhone) {
        await this.smsService.sendSms({
          to: payment.userPhone,
          message: `Payment failed for order ${payment.orderId}. Reason: ${paystackData.gateway_response}. Please try again.`,
        });
      }
    } catch (error) {
      this.logger.error('Error sending payment failure notification:', error);
    }
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(paymentData: {
    email: string;
    amount: number;
    reference: string;
    metadata?: any;
  }): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> {
    try {
      const response = await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: paymentData.email,
            amount: paymentData.amount * 100, // Convert to kobo
            reference: paymentData.reference,
            metadata: paymentData.metadata,
          }),
        },
      );

      const result = await response.json();

      if (!result.status) {
        throw new BadRequestException(
          result.message || 'Failed to initialize payment',
        );
      }

      return {
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      };
    } catch (error) {
      this.logger.error('Error initializing payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment with Paystack
   */
  async verifyPayment(reference: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      const result = await response.json();

      if (!result.status) {
        throw new BadRequestException(
          result.message || 'Failed to verify payment',
        );
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error verifying payment:', error);
      throw error;
    }
  }
}
