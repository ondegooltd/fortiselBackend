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
  BadRequestException,
  Res,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OtpDeliveryMethod } from './user.schema';
import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

// DTOs for OTP endpoints
class RequestOtpDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(OtpDeliveryMethod)
  otpDeliveryMethod: OtpDeliveryMethod;
}

class VerifyOtpDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  otp: string;
}

class RequestPasswordResetDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(OtpDeliveryMethod)
  otpDeliveryMethod: OtpDeliveryMethod;
}

class VerifyPasswordResetOtpDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  otp: string;
}

class ResetPasswordDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  newPassword: string;
}

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 registrations per minute
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return {
      message:
        'Signup successful. Please verify the OTP sent to your email or phone to activate your account.',
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 300000 } }) // 5 login attempts per 5 minutes
  async login(@Body() loginDto: LoginDto) {
    let user;
    if (loginDto.email) {
      user = await this.userService.findByEmail(loginDto.email);
    } else if (loginDto.phone) {
      user = await this.userService.findByPhone(loginDto.phone);
    } else if (loginDto.userId) {
      user = await this.userService.findByUserId(loginDto.userId);
    } else {
      throw new BadRequestException(
        'Please provide email, phone, or userId to login.',
      );
    }
    const isValidPassword = await this.userService.validatePassword(
      user,
      loginDto.password,
    );
    if (!isValidPassword) {
      throw new BadRequestException('Invalid credentials');
    }
    await this.userService.updateLastLogin(user.id);
    // Generate JWT access token
    const payload = {
      sub: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        authProvider: user.authProvider,
        googleId: user.googleId,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        refreshToken: user.refreshToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  @Post('request-otp')
  @Throttle({ short: { limit: 5, ttl: 300000 } }) // 3 OTP requests per 5 minutes
  async requestOtp(@Body(new ValidationPipe()) body: RequestOtpDto) {
    const { email, phone, otpDeliveryMethod } = body;
    if (!email && !phone) {
      throw new BadRequestException('Provide either email or phone');
    }
    return this.userService.requestOtp({ email, phone }, otpDeliveryMethod);
  }

  @Post('verify-otp')
  async verifyOtp(@Body(new ValidationPipe()) body: VerifyOtpDto) {
    const { email, phone, otp } = body;
    if (!email && !phone) {
      throw new BadRequestException('Provide either email or phone');
    }
    return this.userService.verifyOtp({ email, phone }, otp);
  }

  @Post('request-password-reset')
  @Throttle({ short: { limit: 3, ttl: 300000 } }) // 3 password reset requests per 5 minutes
  async requestPasswordReset(
    @Body(new ValidationPipe()) body: RequestPasswordResetDto,
  ) {
    const { email, phone, otpDeliveryMethod } = body;
    if (!email && !phone) {
      throw new BadRequestException('Provide either email or phone');
    }
    return this.userService.requestPasswordReset(
      { email, phone },
      otpDeliveryMethod,
    );
  }

  @Post('verify-password-reset-otp')
  async verifyPasswordResetOtp(
    @Body(new ValidationPipe()) body: VerifyPasswordResetOtpDto,
  ) {
    const { email, phone, otp } = body;
    if (!email && !phone) {
      throw new BadRequestException('Provide either email or phone');
    }
    return this.userService.verifyPasswordResetOtp({ email, phone }, otp);
  }

  @Post('reset-password')
  async resetPassword(@Body(new ValidationPipe()) body: ResetPasswordDto) {
    const { email, phone, newPassword } = body;
    if (!email && !phone) {
      throw new BadRequestException('Provide either email or phone');
    }
    return this.userService.resetPassword({ email, phone }, newPassword);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    // Use userId from JWT payload for consistency
    return this.userService.getProfileWithStats(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(req.user.userId, updateUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Get('auth/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('auth/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    // Successful authentication, issue JWT and redirect or respond
    const user = req.user as any;
    const payload = {
      sub: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      googleId: user.googleId,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    res.json({
      message: 'Google login successful',
      accessToken,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        authProvider: user.authProvider,
        googleId: user.googleId,
        profilePicture: user.profilePicture,
      },
    });
  }
}
