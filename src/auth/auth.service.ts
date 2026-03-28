import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { UserDocument } from '../user/schemas/user.schema';
import { LoginDto } from '../user/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/schemas/user.schema';

import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { EmailService } from '../common/services/email.service';
import * as admin from 'firebase-admin';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
    ) { }

    /**
     * Web Google OAuth (passport-google-oauth20) — find or create local user by email.
     */
    async validateOAuthUser(
        userProfile: {
            email: string;
            firstName?: string;
            lastName?: string;
            picture?: string;
            providerId: string;
            accessToken?: string;
        },
        _provider: string,
    ): Promise<UserDocument> {
        return this.userService.findOrCreateGoogleUser({
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            picture: userProfile.picture,
        });
    }

    /**
     * Issue access + refresh tokens, persist hashed refresh token (same as email/password login).
     */
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

    /**
     * After FirebaseGuard: payload is { uid, email?, name?, provider? } — sync to User then issue tokens.
     */
    async issueTokensFromOAuthGuardPayload(payload: {
        uid: string;
        email?: string;
        name?: string;
        provider?: string;
    }): Promise<TokenResponseDto> {
        let user: UserDocument | null = await this.userService.findByFirebaseUid(payload.uid);

        if (!user && payload.email) {
            const byEmail = await this.userService.findOneByEmail(payload.email);
            if (byEmail) {
                user = await this.userService.linkFirebaseUid(byEmail._id.toString(), payload.uid);
            }
        }

        if (!user) {
            user = await this.userService.createFromFirebase({
                uid: payload.uid,
                email: payload.email,
                fullName: payload.name,
            });
        }

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
                firebaseUid: user.firebaseUid,
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

    async loginWithFirebase(firebaseLoginDto: FirebaseLoginDto) {
        let uid: string | undefined;
        let email: string | undefined;
        let fullName: string | undefined;
        let profileImage: string | undefined;

        if (firebaseLoginDto.idToken) {
            try {
                const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(firebaseLoginDto.idToken);
                uid = decodedToken.uid;
                email = decodedToken.email;
                fullName = decodedToken.name;
                profileImage = decodedToken.picture;
            } catch {
                throw new UnauthorizedException('رمز Firebase غير صالح');
            }
        } else if (firebaseLoginDto.uid) {
            uid = firebaseLoginDto.uid;
            try {
                const firebaseUser = await this.firebaseAdmin.auth().getUser(uid);
                email = firebaseUser.email;
                fullName = firebaseUser.displayName || undefined;
                profileImage = firebaseUser.photoURL || undefined;
            } catch {
                throw new UnauthorizedException('معرف Firebase غير صالح');
            }
        } else {
            throw new BadRequestException('idToken أو uid مطلوب');
        }

        const resolvedUid = uid as string;

        // 1) Find existing Firebase-linked account by UID
        let user = await this.userService.findByFirebaseUid(resolvedUid);

        // 2) If same email already exists in local account, link it to this Firebase UID
        if (!user && email) {
            const existingByEmail = await this.userService.findOneByEmail(email);
            if (existingByEmail) {
                user = await this.userService.linkFirebaseUid(existingByEmail._id.toString(), resolvedUid);
            }
        }

        // 3) First-time Firebase sign-in: create local account from decoded token payload
        if (!user) {
            user = await this.userService.createFromFirebase({ uid: resolvedUid, email, fullName, profileImage });
        }

        // Issue the same access + refresh token pair as a normal login
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
                firebaseUid: user.firebaseUid,
            },
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
        console.log(`Reset Password Token for ${user.email}: ${token}`);

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
}
