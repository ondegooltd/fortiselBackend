import { Logger } from '@nestjs/common';
import got from 'got';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

@Injectable()
export class MnotifySmsService {
  private providerUrl: string;
  private authKey: string;
  private smsSenderId: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const smsProvider = this.configService.get('sms.provider');
    const authKey = this.configService.get('sms.mnotify.apiKey');
    const providerUrl = this.configService.get('sms.mnotify.providerUrl');
    const smsSenderId = this.configService.get('sms.mnotify.smsSenderId');

    if (!providerUrl || !authKey || !smsSenderId) {
      this.logger.warn(
        'MNotify credentials are not configured. SMS service will be disabled.',
        {
          type: 'sms_service_disabled',
        },
      );
      this.providerUrl = '';
      this.authKey = '';
      this.smsSenderId = '';
    } else {
      this.providerUrl = providerUrl;
      this.authKey = authKey;
      this.smsSenderId = smsSenderId;
    }
  }

  async send(
    is_schedule: boolean,
    schedule_date: string,
    sender: string,
    recipient: string[],
    message: string,
  ) {
    const url = `${this.providerUrl}?key=${this.authKey}`;
    const payload = {
      recipient: recipient,
      sender: sender,
      message: message,
      is_schedule: is_schedule,
      schedule_date: schedule_date,
    };

    try {
      const response = await got.post(url, {
        json: payload,
        responseType: 'json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if ((response.body as any).status === 'success') {
        return {
          success: true,
          message: 'SMS with 4 digit pin sent to your mobile number.',
          status: 200,
        };
      } else {
        return {
          success: false,
          message: (response.body as any).message,
          error: (response.body as any).error,
          status: 400,
        };
      }
    } catch (error: any) {
      this.logger.logError(error as Error, {
        to: recipient,
        type: 'sms_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendMany(
    is_schedule: boolean,
    schedule_date: string,
    sender: string,
    recipient: string[],
    message: string,
  ): Promise<any> {
    try {
      for (const userPhoneNumber of recipient) {
        await this.send(
          is_schedule,
          schedule_date,
          sender,
          [userPhoneNumber],
          message,
        );
      }
    } catch (err) {
      this.logger.logError(err as Error, {
        to: recipient,
        type: 'sms_error',
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
