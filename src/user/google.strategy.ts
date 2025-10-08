import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { AuthProvider } from './user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get('google.clientId'),
      clientSecret: configService.get('google.clientSecret'),
      callbackURL: configService.get('google.callbackUrl'),
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Find or create user in the database
    const { id, displayName, emails, photos } = profile;
    const email = emails && emails[0]?.value;
    const profilePicture = photos && photos[0]?.value;
    let user: any = await this.userService.findByGoogleId(id);
    if (user && typeof user.toObject === 'function')
      user = user.toObject() as any;
    if (!user && email) {
      user = await this.userService.findByEmail(email);
      if (user) {
        if (!user.googleId) {
          user.googleId = id;
          user.authProvider = AuthProvider.GOOGLE;
          user.profilePicture = profilePicture;
          await user.save();
        }
        if (typeof user.toObject === 'function') user = user.toObject() as any;
      }
    }
    if (!user) {
      user = await this.userService.createWithGoogle({
        name: displayName,
        email,
        googleId: id,
        profilePicture,
        authProvider: AuthProvider.GOOGLE,
        isEmailVerified: true,
      });
      if (user && typeof user.toObject === 'function')
        user = user.toObject() as any;
    }
    done(null, user);
  }
}
