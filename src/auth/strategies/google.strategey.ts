import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    const port = process.env.PORT || '3000';
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      `http://localhost:${port}/api/auth/google/callback`;

    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL,
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: Error | null, user?: unknown) => void,
  ) {
    try {
      const { name, emails, photos } = profile;
      const email = emails?.[0]?.value;
      if (!email) {
        return done(
          new Error('لم يُرجع Google عنوان بريد إلكتروني (نطاق email).'),
          undefined,
        );
      }

      const userProfile = {
        email,
        firstName: name?.givenName,
        lastName: name?.familyName,
        picture: photos?.[0]?.value,
        providerId: profile.id,
        accessToken,
      };

      const user = await this.authService.validateOAuthUser(
        userProfile,
        'google',
      );
      done(null, user);
    } catch (err) {
      done(err instanceof Error ? err : new Error(String(err)), undefined);
    }
  }
}
