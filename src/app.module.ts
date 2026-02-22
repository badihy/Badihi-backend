import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { google } from 'googleapis';
import { CoursesModule } from './courses/courses.module';
import { CategoriesModule } from './categories/categories.module';
import { SlidesModule } from './slides/slides.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/', // This serves files at root, e.g. /.well-known/assetlinks.json
    }),
   MailerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const user = configService.get<string>('EMAIL_FROM') || configService.get<string>('SMTP_USER');
    if (!user) throw new Error('Missing EMAIL_FROM (gmail address)');

    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri =
      configService.get<string>('GOOGLE_REDIRECT_URI') || 'https://developers.google.com/oauthplayground';
    const refreshToken = configService.get<string>('GOOGLE_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN');
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;
    if (!accessToken) throw new Error('Failed to get Google access token');

    return {
      transport: {
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user,
          clientId,
          clientSecret,
          refreshToken,
          accessToken,
        },
      },
      defaults: {
        from: `"Badihi" <${user}>`,
      },
    };
  },
}),
    DatabaseModule,
    UserModule,
    AuthModule,
    FirebaseModule,
    CoursesModule,
    CategoriesModule,
    SlidesModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
