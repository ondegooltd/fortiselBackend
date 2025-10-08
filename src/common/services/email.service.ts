import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { LoggerService } from './logger.service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private resend: Resend | null;
  private readonly fromEmail: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const apiKey = this.configService.get('email.resend.apiKey');
    if (!apiKey || apiKey === 're_your_resend_api_key_here') {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email service will be disabled.',
        {
          type: 'email_service_disabled',
        },
      );
      this.resend = null;
      this.fromEmail = 'noreply@fortisel.com';
    } else {
      this.resend = new Resend(apiKey);
      this.fromEmail =
        this.configService.get('email.resend.from') || 'noreply@fortisel.com';
    }
  }

  /**
   * Send a simple email
   */
  async sendEmail(
    options: EmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.resend) {
      this.logger.warn('Email service is disabled. Email not sent.', {
        to: options.to,
        subject: options.subject,
        type: 'email_service_disabled',
      });
      return {
        success: false,
        error: 'Email service is not configured',
      };
    }

    try {
      const result = await this.resend.emails.send({
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || '',
        reply_to: options.replyTo,
        attachments: options.attachments,
      });

      this.logger.log('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.data?.id,
        type: 'email_sent',
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        to: options.to,
        subject: options.subject,
        type: 'email_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    name?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = 'Your Fortisel Verification Code';
    const html = this.getOtpEmailTemplate(otp, name);
    const text = `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = 'Welcome to Fortisel!';
    const html = this.getWelcomeEmailTemplate(name);
    const text = `Welcome to Fortisel, ${name}!\n\nThank you for joining us. We're excited to help you with your LPG needs.\n\nBest regards,\nThe Fortisel Team`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    email: string,
    orderDetails: {
      orderId: string;
      customerName: string;
      cylinderSize: string;
      scheduledDate: string;
      totalAmount: number;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Order Confirmation - ${orderDetails.orderId}`;
    const html = this.getOrderConfirmationTemplate(orderDetails);
    const text = `Order Confirmation\n\nOrder ID: ${orderDetails.orderId}\nCustomer: ${orderDetails.customerName}\nCylinder Size: ${orderDetails.cylinderSize}\nScheduled Date: ${orderDetails.scheduledDate}\nTotal Amount: $${orderDetails.totalAmount}\n\nThank you for choosing Fortisel!`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    name?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resetUrl = `${this.configService.get('app.frontendUrl') || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Fortisel Password';
    const html = this.getPasswordResetTemplate(resetUrl, name);
    const text = `Reset Your Password\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send delivery notification email
   */
  async sendDeliveryNotificationEmail(
    email: string,
    deliveryDetails: {
      orderId: string;
      customerName: string;
      driverName: string;
      driverPhone: string;
      estimatedTime: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Your Order is Out for Delivery - ${deliveryDetails.orderId}`;
    const html = this.getDeliveryNotificationTemplate(deliveryDetails);
    const text = `Your Order is Out for Delivery\n\nOrder ID: ${deliveryDetails.orderId}\nDriver: ${deliveryDetails.driverName}\nDriver Phone: ${deliveryDetails.driverPhone}\nEstimated Delivery Time: ${deliveryDetails.estimatedTime}\n\nTrack your delivery in the app!`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Get OTP email template
   */
  private getOtpEmailTemplate(otp: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fortisel</h1>
          </div>
          <div class="content">
            <h2>Verification Code</h2>
            ${name ? `<p>Hello ${name},</p>` : '<p>Hello,</p>'}
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Fortisel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email template
   */
  private getWelcomeEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Fortisel</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Fortisel!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to Fortisel! We're excited to have you on board.</p>
            <p>With Fortisel, you can:</p>
            <ul>
              <li>Order LPG cylinders easily</li>
              <li>Track your deliveries in real-time</li>
              <li>Schedule convenient delivery times</li>
              <li>Make secure payments</li>
            </ul>
            <p>Get started by placing your first order!</p>
          </div>
          <div class="footer">
            <p>© 2024 Fortisel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get order confirmation template
   */
  private getOrderConfirmationTemplate(orderDetails: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order!</h2>
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
              <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
              <p><strong>Cylinder Size:</strong> ${orderDetails.cylinderSize}</p>
              <p><strong>Scheduled Date:</strong> ${orderDetails.scheduledDate}</p>
              <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
            </div>
            <p>We'll notify you when your order is out for delivery.</p>
          </div>
          <div class="footer">
            <p>© 2024 Fortisel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset template
   */
  private getPasswordResetTemplate(resetUrl: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            ${name ? `<p>Hello ${name},</p>` : '<p>Hello,</p>'}
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Fortisel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get delivery notification template
   */
  private getDeliveryNotificationTemplate(deliveryDetails: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Order is Out for Delivery</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .delivery-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order is Out for Delivery!</h1>
          </div>
          <div class="content">
            <h2>Delivery Information</h2>
            <div class="delivery-details">
              <p><strong>Order ID:</strong> ${deliveryDetails.orderId}</p>
              <p><strong>Driver Name:</strong> ${deliveryDetails.driverName}</p>
              <p><strong>Driver Phone:</strong> ${deliveryDetails.driverPhone}</p>
              <p><strong>Estimated Delivery Time:</strong> ${deliveryDetails.estimatedTime}</p>
            </div>
            <p>Track your delivery in the app for real-time updates!</p>
          </div>
          <div class="footer">
            <p>© 2024 Fortisel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
