import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { UserDocument } from '../user/schemas/user.schema';
import { LoginDto } from '../user/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/schemas/user.schema';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { EmailService } from '../common/services/email.service';
import { TokenResponseDto } from './dto/token-response.dto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { UserRole } from './enums/user-role.enum';

type GoogleIdentity = {
  uid: string;
  email?: string;
  name?: string;
  profileImage?: string;
  provider: 'google';
};

const googleClient = new OAuth2Client();

function formatGoogleVerificationError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : 'Unknown Google ID token verification failure';

  if (message.startsWith('Invalid token signature')) {
    return 'Invalid token signature';
  }

  return message;
}

function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error(
      'GOOGLE_CLIENT_ID is not configured for ID token verification',
    );
  }
  return clientId;
}

function mapGoogleTokenPayload(payload: TokenPayload): GoogleIdentity {
  return {
    uid: payload.sub,
    email: payload.email,
    name: payload.name,
    profileImage: payload.picture,
    provider: 'google',
  };
}

async function verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
  const audience = getGoogleClientId();

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('Failed to verify Google ID token');
  }

  if (payload.aud !== audience) {
    throw new Error(
      'Google ID token audience does not match the configured web client ID',
    );
  }

  return payload;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async issueTokenPairForUser(user: UserDocument): Promise<TokenResponseDto> {
    const tokens = await this.getTokens(user._id, user.email);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        phone: user.phone,
        name: user.fullName,
        profileImage: user.profileImage,
        role: user.role ?? UserRole.USER,
      },
    };
  }

  async issueTokensFromGooglePayload(
    payload: GoogleIdentity,
  ): Promise<TokenResponseDto> {
    if (!payload.email) {
      throw new UnauthorizedException('Google account email is required');
    }

    const user = await this.userService.findOrCreateGoogleUser({
      email: payload.email,
      fullName: payload.name,
      picture: payload.profileImage,
    });

    if (!user) {
      throw new UnauthorizedException('Unable to create or retrieve the user');
    }

    return this.issueTokenPairForUser(user);
  }

  async login(loginDto: LoginDto): Promise<{
    token: string;
    refreshToken: string;
    user: Omit<User, 'password'> & { _id: any };
  }> {
    const user = await this.userService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    const tokens = await this.getTokens(user._id, user.email);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        fullName: user.fullName,
        role: user.role ?? UserRole.USER,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.getTokens(user._id, user.email);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    // We do not store the plain token, we hash it
    await this.userService.updateRefreshToken(userId, refreshToken);
  }

  async getTokens(userId: any, email: string) {
    const user = await this.userService.findById(String(userId));
    const role = user?.role ?? UserRole.USER;
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id: userId, email, role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { id: userId, email, role },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findOneByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.userService.updateResetToken(
      user._id.toString(),
      token,
      expires,
    );
    try {
      await this.emailService.sendResetPasswordEmail(
        user.email,
        user.fullName || 'User',
        token,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Reset password email failed for user ${user.email}: ${message}`,
      );
      throw new ServiceUnavailableException(
        'تعذر إرسال بريد إعادة تعيين كلمة المرور حالياً، يرجى المحاولة لاحقاً',
      );
    }

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userService.findByResetToken(
      resetPasswordDto.token,
    );
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.userService.updatePassword(
      user._id.toString(),
      resetPasswordDto.newPassword,
    );

    const tokens = await this.issueTokenPairForUser(user);

    return {
      message: 'Password reset successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    };
  }
  async verifyEmail(token: string) {
    const user = await this.userService.verifyEmail(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    return {
      message: 'Email verified successfully',
    };
  }

  async googleSignInMobile(idToken: string): Promise<TokenResponseDto> {
    if (!idToken?.trim()) {
      throw new BadRequestException('idToken is required');
    }

    const payload = await this.verifyMobileIdentityToken(idToken);
    return this.issueTokensFromGooglePayload(payload);
  }

  private async verifyMobileIdentityToken(
    idToken: string,
  ): Promise<GoogleIdentity> {
    try {
      const payload = await verifyGoogleIdToken(idToken);
      return mapGoogleTokenPayload(payload);
    } catch (error) {
      const message = formatGoogleVerificationError(error);
      this.logger.warn(`Google ID token verification failed: ${message}`);
      throw new UnauthorizedException('Invalid or expired ID token');
    }
  }
}
