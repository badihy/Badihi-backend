import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const port = configService.get<string>('PORT') || '3000';
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') ||
      `http://localhost:${port}/api/auth/google/callback`;

    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || '';

    if (!callbackURL?.trim()) {
      throw new Error('GOOGLE_CALLBACK_URL غير مُعرّف ولا يمكن اشتقاق عنوان الاستدعاء');
    }
    if (!clientID || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID أو GOOGLE_CLIENT_SECRET غير مُعرّف');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    } as StrategyOptions);

    this.logger.log(`Google OAuth callbackURL: ${callbackURL}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const { name, emails, photos } = profile;
    const userProfile = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      providerId: profile.id,
      accessToken,
    };

    const user = await this.authService.validateOAuthUser(
      userProfile,
      'google',
    );
    done(null, user);
  }
}
