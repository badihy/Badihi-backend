import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { GoogleStrategy } from './strategies/google.strategey';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from '../common/services/email.service';
import { PassportModule } from '@nestjs/passport';
import { FirebaseGuard } from './guards/firebase.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    FirebaseModule,
    forwardRef(() => UserModule)
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
    EmailService,
    FirebaseGuard,
    GoogleOAuthGuard,
  ],
  exports: [AuthService],
})
export class AuthModule { }
