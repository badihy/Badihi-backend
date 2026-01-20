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
        const host = configService.get<string>('SMTP_HOST') || configService.get<string>('EMAIL_HOST') || 'smtp.zoho.com';
        const port = parseInt(configService.get<string>('SMTP_PORT') || configService.get<string>('EMAIL_PORT') || '587', 10);
        const user = configService.get<string>('SMTP_USER') || configService.get<string>('EMAIL_USER') || 'no-reply-elms450@zohomail.com';
        const pass = configService.get<string>('SMTP_PASS') || configService.get<string>('EMAIL_PASSWORD') || '';
        const secure = configService.get<string>('SMTP_SECURE') === 'true' || port === 465;

        return {
          transport: {
            host,
            port,
            secure,
            auth: { user, pass },
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
    FirebaseModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
