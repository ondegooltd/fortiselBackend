import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { ApiVersion } from '../common/decorators/api-version.decorator';

@ApiVersion('v1')
@Controller('two-factor-auth')
@UseGuards(JwtAuthGuard)
export class TwoFactorAuthController {
  constructor(private readonly twoFactorAuthService: TwoFactorAuthService) {}

  @Get('status')
  async getStatus(@Request() req) {
    return this.twoFactorAuthService.getStatus(req.user.userId);
  }

  @Post('generate-secret')
  @HttpCode(HttpStatus.OK)
  async generateSecret(@Request() req) {
    return this.twoFactorAuthService.generateSecret(req.user.userId);
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  async enable(@Request() req, @Body() enable2FADto: Enable2FADto) {
    return this.twoFactorAuthService.enable(enable2FADto, req.user.userId);
  }

  @Delete('disable')
  @HttpCode(HttpStatus.OK)
  async disable(@Request() req) {
    return this.twoFactorAuthService.disable(req.user.userId);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Request() req, @Body() verify2FADto: Verify2FADto) {
    return this.twoFactorAuthService.verify(verify2FADto, req.user.userId);
  }

  @Post('regenerate-backup-codes')
  @HttpCode(HttpStatus.OK)
  async regenerateBackupCodes(@Request() req) {
    return this.twoFactorAuthService.regenerateBackupCodes(req.user.userId);
  }
}
