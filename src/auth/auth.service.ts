import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, Inject, ForbiddenException } from '@nestjs/common';
import { LoginDto } from '../user/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../user/schemas/user.schema';
import * as admin from 'firebase-admin';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin
    ) { }

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
        let decodedToken;
        try {
            decodedToken = await this.firebaseAdmin.auth().verifyIdToken(firebaseLoginDto.token);
        } catch (error) {
            throw new UnauthorizedException('رمز Firebase غير صحيح');
        }

        let user = await this.userService.findByFirebaseUid(decodedToken.uid);
        if (!user) {
            user = await this.userService.createFromFirebase(decodedToken);
        }

        const payload = { id: user._id };
        const token = this.jwtService.sign(payload, { expiresIn: '7d' });

        return {
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                fullName: user.fullName,
                firebaseUid: user.firebaseUid,
            }
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
