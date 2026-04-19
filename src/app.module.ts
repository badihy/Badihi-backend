import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CoursesModule } from './courses/courses.module';
import { CategoriesModule } from './categories/categories.module';
import { SlidesModule } from './slides/slides.module';
import { ReportsModule } from './reports/reports.module';
import { CertificateModule } from './certificate/certificate.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
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
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('EMAIL_HOST');
        const port = Number(configService.get<string>('EMAIL_PORT') || '465');
        const user = configService.get<string>('EMAIL_USERNAME');
        const pass = configService.get<string>('EMAIL_PASSWORD');
        const from = configService.get<string>('EMAIL_FROM') || user;

        if (!host || !user || !pass || !from) {
          throw new Error(
            'Missing EMAIL_HOST / EMAIL_USERNAME / EMAIL_PASSWORD / EMAIL_FROM',
          );
        }

        return {
          transport: {
            host,
            port,
            secure: port === 465,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: `"Badihi" <${from}>`,
          },
        };
      },
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    CoursesModule,
    CategoriesModule,
    SlidesModule,
    ReportsModule,
    CertificateModule,
    BookmarksModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
