import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

const googleClient = new OAuth2Client();

function getAllowedGoogleClientIds(): string[] {
    return [process.env.GOOGLE_CLIENT_ID_MOBILE]
        .filter(Boolean)
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);
}

async function verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
    const audience = getAllowedGoogleClientIds();

    if (audience.length === 0) {
        throw new Error('No Google client IDs configured for ID token verification');
    }

    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience,
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new Error('Failed to verify Google ID token');
    }

    return payload;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

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
            },
        };
    }

    async issueTokensFromGooglePayload(payload: {
        uid: string;
        email?: string;
        name?: string;
        profileImage?: string;
        provider?: string;
    }): Promise<TokenResponseDto> {
        if (!payload.email) {
            throw new UnauthorizedException('Google account email is required');
        }

        const user = await this.userService.findOrCreateGoogleUser({
            email: payload.email,
            fullName: payload.name,
            picture: payload.profileImage,
        });

        if (!user) {
            throw new UnauthorizedException('تعذر إنشاء أو استرجاع المستخدم');
        }

        return this.issueTokenPairForUser(user);
    }

    async login(loginDto: LoginDto): Promise<{ token: string, refreshToken: string, user: Omit<User, 'password'> & { _id: any } }> {
        const user = await this.userService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new NotFoundException('المستخدم غير موجود');
        }
        
        if (!user.password) {
            throw new UnauthorizedException('بيانات الدخول غير صحيحة');
        }
        
        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('بيانات الدخول غير صحيحة');
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
            }
        };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.userService.findById(userId);
        if (!user || !user.refreshToken) {
            throw new ForbiddenException('الوصول مرفوض');
        }

        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!refreshTokenMatches) {
            throw new ForbiddenException('الوصول مرفوض');
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
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                { id: userId, email },
                {
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: '15m',
                },
            ),
            this.jwtService.signAsync(
                { id: userId, email },
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
            throw new NotFoundException('المستخدم غير موجود');
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await this.userService.updateResetToken(user._id.toString(), token, expires);
        await this.emailService.sendResetPasswordEmail(user.email, user.fullName || 'User', token);

        return { message: 'تم إرسال بريد إعادة تعيين كلمة المرور' };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        if (resetPasswordDto.newPassword !== resetPasswordDto.confirmNewPassword) {
            throw new BadRequestException('كلمات المرور غير متطابقة');
        }

        const user = await this.userService.findByResetToken(resetPasswordDto.token);
        if (!user) {
            throw new BadRequestException('الرمز غير صحيح أو منتهي الصلاحية');
        }

        await this.userService.updatePassword(user._id.toString(), resetPasswordDto.newPassword);

        return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
    }
    async verifyEmail(token: string) {
        const user = await this.userService.verifyEmail(token);
        if (!user) {
            throw new BadRequestException('رمز التحقق غير صحيح أو منتهي الصلاحية');
        }
        return { message: 'تم التحقق من البريد الإلكتروني بنجاح' };
    }

    async googleSignInMobile(idToken: string): Promise<TokenResponseDto> {
        if (!idToken?.trim()) {
            throw new BadRequestException('idToken مطلوب');
        }

        const payload = await this.verifyMobileIdentityToken(idToken);
        return this.issueTokensFromGooglePayload(payload);
    }

    private async verifyMobileIdentityToken(idToken: string): Promise<{
        uid: string;
        email?: string;
        name?: string;
        profileImage?: string;
        provider?: string;
    }> {
        try {
            const payload = await verifyGoogleIdToken(idToken);
            return {
                uid: payload.sub,
                email: payload.email,
                name: payload.name,
                profileImage: payload.picture,
                provider: 'google',
            };
        } catch {
            throw new UnauthorizedException('Invalid or expired ID token');
        }
    }
}
