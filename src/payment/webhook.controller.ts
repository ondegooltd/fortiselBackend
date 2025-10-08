import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { PaystackWebhookEvent } from './paystack.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private paystackService: PaystackService) {}

  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(
    @Body() body: PaystackWebhookEvent,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<{ status: string }> {
    try {
      // Verify webhook signature
      const payload = JSON.stringify(body);
      const isValidSignature = this.paystackService.verifyWebhookSignature(
        payload,
        signature,
      );

      if (!isValidSignature) {
        this.logger.warn('Invalid Paystack webhook signature');
        return { status: 'invalid_signature' };
      }

      // Process the webhook event
      await this.paystackService.processWebhookEvent(body);

      this.logger.log(`Successfully processed Paystack webhook: ${body.event}`);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing Paystack webhook:', error);
      return { status: 'error' };
    }
  }
}
