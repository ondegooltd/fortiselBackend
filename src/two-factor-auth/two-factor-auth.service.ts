import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TwoFactorAuth, TwoFactorAuthDocument } from './two-factor-auth.schema';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { LoggerService } from '../common/services/logger.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectModel(TwoFactorAuth.name)
    private twoFactorAuthModel: Model<TwoFactorAuthDocument>,
    private logger: LoggerService,
  ) {}

  async getStatus(userId: string): Promise<BaseResponseDto<any>> {
    try {
      const twoFactorAuth = await this.twoFactorAuthModel
        .findOne({ userId })
        .exec();

      return BaseResponseDto.success(
        {
          isEnabled: twoFactorAuth?.isEnabled || false,
          hasBackupCodes:
            (twoFactorAuth?.backupCodes?.length || 0) > 0 || false,
        },
        '2FA status retrieved successfully',
      );
    } catch (error) {
      this.logger.error('Failed to get 2FA status', error, {
        context: 'TwoFactorAuthService',
        userId,
      });
      throw new BadRequestException('Failed to get 2FA status');
    }
  }

  async generateSecret(userId: string): Promise<BaseResponseDto<any>> {
    try {
      // Check if 2FA is already enabled
      const existing2FA = await this.twoFactorAuthModel
        .findOne({ userId })
        .exec();
      if (existing2FA?.isEnabled) {
        throw new ConflictException(
          'Two-factor authentication is already enabled',
        );
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: 'Fortisel',
        length: 32,
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Save or update 2FA record
      const twoFactorAuth = await this.twoFactorAuthModel
        .findOneAndUpdate(
          { userId },
          {
            secret: secret.base32,
            backupCodes,
            isEnabled: false,
            updatedAt: new Date(),
          },
          { upsert: true, new: true },
        )
        .exec();

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

      this.logger.log(`2FA secret generated for user: ${userId}`, {
        context: 'TwoFactorAuthService',
        userId,
      });

      return BaseResponseDto.success(
        {
          secret: secret.base32,
          qrCodeUrl,
          backupCodes,
        },
        '2FA secret generated successfully',
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to generate 2FA secret', error, {
        context: 'TwoFactorAuthService',
        userId,
      });
      throw new BadRequestException('Failed to generate 2FA secret');
    }
  }

  async enable(
    enable2FADto: Enable2FADto,
    userId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const twoFactorAuth = await this.twoFactorAuthModel
        .findOne({ userId })
        .exec();
      if (!twoFactorAuth) {
        throw new NotFoundException(
          '2FA setup not found. Please generate a secret first.',
        );
      }

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: twoFactorAuth.secret,
        encoding: 'base32',
        token: enable2FADto.verificationCode,
        window: 2,
      });

      if (!verified) {
        throw new BadRequestException('Invalid verification code');
      }

      // Enable 2FA
      twoFactorAuth.isEnabled = true;
      twoFactorAuth.updatedAt = new Date();
      await twoFactorAuth.save();

      this.logger.log(`2FA enabled for user: ${userId}`, {
        context: 'TwoFactorAuthService',
        userId,
      });

      return BaseResponseDto.success(
        { isEnabled: true },
        'Two-factor authentication enabled successfully',
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Failed to enable 2FA', error, {
        context: 'TwoFactorAuthService',
        userId,
      });
      throw new BadRequestException('Failed to enable 2FA');
    }
  }

  async disable(userId: string): Promise<BaseResponseDto<any>> {
    try {
      const twoFactorAuth = await this.twoFactorAuthModel
        .findOne({ userId })
        .exec();
      if (!twoFactorAuth) {
        throw new NotFoundException('2FA not found');
      }

      twoFactorAuth.isEnabled = false;
      twoFactorAuth.updatedAt = new Date();
      await twoFactorAuth.save();

      this.logger.log(`2FA disabled for user: ${userId}`, {
        context: 'TwoFactorAuthService',
        userId,
      });

      return BaseResponseDto.success(
        { isEnabled: false },
        'Two-factor authentication disabled successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to disable 2FA', error, {
        context: 'TwoFactorAuthService',
        userId,
      });
      throw new BadRequestException('Failed to disable 2FA');
    }
  }

  async verify(
    verify2FADto: Verify2FADto,
    userId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const twoFactorAuth = await this.twoFactorAuthModel
        .findOne({ userId })
        .exec();
      if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
        throw new NotFoundException('2FA not enabled');
      }

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: twoFactorAuth.secret,
        encoding: 'base32',
        token: verify2FADto.code,
        window: 2,
      });

      if (!verified) {
        throw new BadRequestException('Invalid verification code');
      }

      // Update last used
      twoFactorAuth.lastUsed = new Date();
      await twoFactorAuth.save();

      this.logger.log(`2FA verified for user: ${userId}`, {
        context: 'TwoFactorAuthService',
        userId,
      });

      return BaseResponseDto.success(
        { verified: true },
        '2FA verification successful',
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Failed to verify 2FA', error, {
        context: 'TwoFactorAuthService',
        userId,
      });
      throw new BadRequestException('Failed to verify 2FA');
    }
  }

  async regenerateBackupCodes(userId: string): Promise<BaseResponseDto<any>> {
    try {
      const twoFactorAuth = await this.twoFactorAuthModel
        .findOne({ userId })
        .exec();
      if (!twoFactorAuth) {
        throw new NotFoundException('2FA not found');
      }

      const backupCodes = this.generateBackupCodes();
      twoFactorAuth.backupCodes = backupCodes;
      twoFactorAuth.updatedAt = new Date();
      await twoFactorAuth.save();

      this.logger.log(`Backup codes regenerated for user: ${userId}`, {
        context: 'TwoFactorAuthService',
        userId,
      });

      return BaseResponseDto.success(
        { backupCodes },
        'Backup codes regenerated successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to regenerate backup codes', error, {
        context: 'TwoFactorAuthService',
        userId,
      });
      throw new BadRequestException('Failed to regenerate backup codes');
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
