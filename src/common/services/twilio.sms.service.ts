import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { LoggerService } from './logger.service';

export interface SmsOptions {
  to: string;
  message: string;
  from?: string;
}

@Injectable()
export class TwilioSmsService {
  private twilio: Twilio | null;
  private readonly fromNumber: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const smsProvider = this.configService.get('sms.provider');
    const accountSid = this.configService.get('sms.twilio.accountSid');
    const authToken = this.configService.get('sms.twilio.authToken');
    const phoneNumber = this.configService.get('sms.twilio.phoneNumber');

    if (
      !accountSid ||
      !authToken ||
      accountSid === 'your_twilio_account_sid' ||
      authToken === 'your_twilio_auth_token'
    ) {
      this.logger.warn(
        'Twilio credentials are not configured. SMS service will be disabled.',
        {
          type: 'sms_service_disabled',
        },
      );
      this.twilio = null;
      this.fromNumber = '';
    } else {
      this.twilio = new Twilio(accountSid, authToken);
      this.fromNumber = phoneNumber || '';
    }
  }

  /**
   * Send a simple SMS
   */
  async sendSms(
    options: SmsOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.twilio) {
      this.logger.warn('SMS service is disabled. SMS not sent.', {
        to: options.to,
        type: 'sms_service_disabled',
      });
      return {
        success: false,
        error: 'SMS service is not configured',
      };
    }

    try {
      const message = await this.twilio.messages.create({
        body: options.message,
        from: options.from || this.fromNumber,
        to: options.to,
      });

      this.logger.log('SMS sent successfully', {
        to: options.to,
        messageId: message.sid,
        type: 'sms_sent',
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        to: options.to,
        type: 'sms_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOtpSms(
    phone: string,
    otp: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Your Fortisel verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this message.`;

    return this.sendSms({
      to: phone,
      message,
    });
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSms(
    phone: string,
    orderDetails: {
      orderId: string;
      cylinderSize: string;
      scheduledDate: string;
      totalAmount: number;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Order Confirmation\n\nOrder ID: ${orderDetails.orderId}\nCylinder: ${orderDetails.cylinderSize}\nScheduled: ${orderDetails.scheduledDate}\nAmount: $${orderDetails.totalAmount}\n\nThank you for choosing Fortisel!`;

    return this.sendSms({
      to: phone,
      message,
    });
  }

  /**
   * Send delivery notification SMS
   */
  async sendDeliveryNotificationSms(
    phone: string,
    deliveryDetails: {
      orderId: string;
      driverName: string;
      driverPhone: string;
      estimatedTime: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Your order is out for delivery!\n\nOrder ID: ${deliveryDetails.orderId}\nDriver: ${deliveryDetails.driverName}\nDriver Phone: ${deliveryDetails.driverPhone}\nEstimated Time: ${deliveryDetails.estimatedTime}\n\nTrack your delivery in the app!`;

    return this.sendSms({
      to: phone,
      message,
    });
  }

  /**
   * Send delivery completed SMS
   */
  async sendDeliveryCompletedSms(
    phone: string,
    orderId: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Delivery Completed!\n\nYour order ${orderId} has been successfully delivered.\n\nThank you for choosing Fortisel!`;

    return this.sendSms({
      to: phone,
      message,
    });
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmationSms(
    phone: string,
    paymentDetails: {
      orderId: string;
      amount: number;
      paymentMethod: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Payment Confirmed\n\nOrder ID: ${paymentDetails.orderId}\nAmount: $${paymentDetails.amount}\nPayment Method: ${paymentDetails.paymentMethod}\n\nYour order is being processed.`;

    return this.sendSms({
      to: phone,
      message,
    });
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminderSms(
    phone: string,
    appointmentDetails: {
      orderId: string;
      scheduledTime: string;
      driverName: string;
      driverPhone: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Appointment Reminder\n\nOrder ID: ${appointmentDetails.orderId}\nScheduled Time: ${appointmentDetails.scheduledTime}\nDriver: ${appointmentDetails.driverName}\nDriver Phone: ${appointmentDetails.driverPhone}\n\nPlease be available for delivery.`;

    return this.sendSms({
      to: phone,
      message,
    });
  }

  /**
   * Send payment failure SMS
   */
  async sendPaymentFailureSms(
    phone: string,
    paymentDetails: {
      to: string;
      message: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSms({
      to: paymentDetails.to,
      message: paymentDetails.message,
    });
  }

  /**
   * Send support ticket notification SMS
   */
  async sendSupportTicketNotificationSms(
    phone: string,
    ticketDetails: {
      ticketId: string;
      status: string;
      message?: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let message = `Support Ticket Update\n\nTicket ID: ${ticketDetails.ticketId}\nStatus: ${ticketDetails.status}`;

    if (ticketDetails.message) {
      message += `\nMessage: ${ticketDetails.message}`;
    }

    message += '\n\nThank you for contacting Fortisel support.';

    return this.sendSms({
      to: phone,
      message,
    });
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid length (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Format phone number for international use
   */
  formatPhoneNumber(phone: string, countryCode: string = '+1'): string {
    const cleaned = phone.replace(/\D/g, '');

    // If it already starts with country code, return as is
    if (cleaned.startsWith(countryCode.replace('+', ''))) {
      return `+${cleaned}`;
    }

    // Add country code if not present
    return `${countryCode}${cleaned}`;
  }
}
