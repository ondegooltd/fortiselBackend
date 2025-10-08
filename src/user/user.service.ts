import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument, OtpDeliveryMethod } from './user.schema';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, userId, ...rest } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email },
        { phone: createUserDto.phone },
        { userId: createUserDto.userId },
      ],
    });
    if (existingUser) {
      throw new ConflictException(
        'User with this email, phone, or userId already exists',
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Auto-generate userId if not provided
    const generatedUserId =
      userId || `USER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Set isActive and isEmailVerified to false until OTP is verified
    const createdUser = new this.userModel({
      ...rest,
      userId: generatedUserId,
      passwordHash,
      isActive: false,
      isEmailVerified: false,
    });

    // Generate and send OTP
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    createdUser.otp = otp;
    createdUser.otpExpiresAt = otpExpiresAt;
    createdUser.otpDeliveryMethod =
      createUserDto.otpDeliveryMethod || OtpDeliveryMethod.SMS;
    await createdUser.save();
    if (createdUser.otpDeliveryMethod === OtpDeliveryMethod.EMAIL) {
      await this.sendOtpEmail(createdUser.email, otp);
    } else {
      await this.sendOtpSms(createdUser.phone, otp);
    }
    return createdUser;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-passwordHash').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('-passwordHash')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User> {
    const user = await this.userModel.findOne({ phone }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUserId(userId: string): Promise<User> {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByGoogleId(googleId: string) {
    return this.userModel.findOne({ googleId }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, ...rest } = updateUserDto;
    let passwordHash: string | undefined;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { ...rest, ...(passwordHash && { passwordHash }) },
        { new: true },
      )
      .select('-passwordHash')
      .exec();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { lastLoginAt: new Date() })
      .exec();
  }

  // Generate a 6-digit OTP
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via email using Resend
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    try {
      const result = await this.emailService.sendOtpEmail(email, otp);
      if (!result.success) {
        throw new Error(`Failed to send OTP email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
    }
  }

  // Send OTP via SMS using Twilio
  async sendOtpSms(phone: string, otp: string): Promise<void> {
    try {
      const result = await this.smsService.sendOtpSms(phone, otp);
      if (!result.success) {
        throw new Error(`Failed to send OTP SMS: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending OTP SMS:', error);
      throw error;
    }
  }

  // Request OTP for signup or password reset
  async requestOtp(
    identifier: { email?: string; phone?: string },
    otpDeliveryMethod: OtpDeliveryMethod,
  ): Promise<{ message: string }> {
    let user: UserDocument | null = null;
    if (identifier.email) {
      user = await this.userModel.findOne({ email: identifier.email });
    } else if (identifier.phone) {
      user = await this.userModel.findOne({ phone: identifier.phone });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpDeliveryMethod = otpDeliveryMethod;
    await user.save();
    if (otpDeliveryMethod === OtpDeliveryMethod.EMAIL) {
      await this.sendOtpEmail(user.email, otp);
    } else {
      await this.sendOtpSms(user.phone, otp);
    }
    return { message: `OTP sent via ${otpDeliveryMethod}` };
  }

  // Activate user after successful OTP verification
  async activateUserAfterOtp(identifier: {
    email?: string;
    phone?: string;
  }): Promise<{ message: string }> {
    let user: UserDocument | null = null;
    if (identifier.email) {
      user = await this.userModel.findOne({ email: identifier.email });
    } else if (identifier.phone) {
      user = await this.userModel.findOne({ phone: identifier.phone });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = true;
    user.isEmailVerified = true;
    await user.save();
    return { message: 'Account activated' };
  }

  // Verify OTP for signup or password reset
  async verifyOtp(
    identifier: { email?: string; phone?: string },
    otp: string,
  ): Promise<{ valid: boolean; message: string }> {
    let user: UserDocument | null = null;
    if (identifier.email) {
      user = await this.userModel.findOne({ email: identifier.email });
    } else if (identifier.phone) {
      user = await this.userModel.findOne({ phone: identifier.phone });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.otp || !user.otpExpiresAt) {
      return { valid: false, message: 'No OTP requested' };
    }
    if (user.otp !== otp) {
      return { valid: false, message: 'Invalid OTP' };
    }
    if (user.otpExpiresAt < new Date()) {
      return { valid: false, message: 'OTP expired' };
    }
    // OTP is valid, clear it and activate user
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.isActive = true;
    user.isEmailVerified = true;
    await user.save();
    return { valid: true, message: 'OTP verified and account activated' };
  }

  // Request password reset (generates and sends OTP)
  async requestPasswordReset(
    identifier: { email?: string; phone?: string },
    otpDeliveryMethod: OtpDeliveryMethod,
  ): Promise<{ message: string }> {
    let user: UserDocument | null = null;
    if (identifier.email) {
      user = await this.userModel.findOne({ email: identifier.email });
    } else if (identifier.phone) {
      user = await this.userModel.findOne({ phone: identifier.phone });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpDeliveryMethod = otpDeliveryMethod;
    await user.save();
    if (otpDeliveryMethod === OtpDeliveryMethod.EMAIL) {
      await this.sendOtpEmail(user.email, otp);
    } else {
      await this.sendOtpSms(user.phone, otp);
    }
    return { message: `Password reset OTP sent via ${otpDeliveryMethod}` };
  }

  // Verify OTP for password reset
  async verifyPasswordResetOtp(
    identifier: { email?: string; phone?: string },
    otp: string,
  ): Promise<{ valid: boolean; message: string }> {
    let user: UserDocument | null = null;
    if (identifier.email) {
      user = await this.userModel.findOne({ email: identifier.email });
    } else if (identifier.phone) {
      user = await this.userModel.findOne({ phone: identifier.phone });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.otp || !user.otpExpiresAt) {
      return { valid: false, message: 'No OTP requested' };
    }
    if (user.otp !== otp) {
      return { valid: false, message: 'Invalid OTP' };
    }
    if (user.otpExpiresAt < new Date()) {
      return { valid: false, message: 'OTP expired' };
    }
    // OTP is valid, clear it (but do not activate account)
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    return {
      valid: true,
      message: 'OTP verified. You may now reset your password.',
    };
  }

  // Reset password after OTP verification
  async resetPassword(
    identifier: { email?: string; phone?: string },
    newPassword: string,
  ): Promise<{ message: string }> {
    let user: UserDocument | null = null;
    if (identifier.email) {
      user = await this.userModel.findOne({ email: identifier.email });
    } else if (identifier.phone) {
      user = await this.userModel.findOne({ phone: identifier.phone });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Hash new password
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();
    return { message: 'Password reset successful' };
  }

  /**
   * Create user with Google OAuth
   */
  async createWithGoogle(userData: {
    name: string;
    email: string;
    googleId: string;
    profilePicture?: string;
    authProvider: any;
    isEmailVerified: boolean;
  }): Promise<User> {
    const {
      name,
      email,
      googleId,
      profilePicture,
      authProvider,
      isEmailVerified,
    } = userData;

    // Check if user already exists with this email
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      // Update existing user with Google ID
      existingUser.googleId = googleId;
      existingUser.authProvider = authProvider;
      existingUser.profilePicture = profilePicture;
      existingUser.isEmailVerified = isEmailVerified;
      return existingUser.save();
    }

    // Create new user
    const userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newUser = new this.userModel({
      userId,
      name,
      email,
      googleId,
      profilePicture,
      authProvider,
      isEmailVerified,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return newUser.save();
  }
}
