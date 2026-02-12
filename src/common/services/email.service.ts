import { MailerService } from '@nestjs-modules/mailer';
import { Global, Injectable } from '@nestjs/common';
import { getWelcomeEmailHtml } from '../templates/welcome.template';
import { getResetPasswordEmailHtml } from '../templates/reset-password.template';

@Global()
@Injectable()
export class EmailService {
    constructor(private readonly mailService: MailerService) { }

    /**
     * Sends welcome email with verification link
     * Used during user registration
     * @param email User's email address
     * @param name User's full name
     * @param token Verification token
     */
    async sendWelcomeEmail(email: string, name: string, token: string) {
        // Verification link (Direct App Link)
        const appLink = `https://api.badihy.com/verify-email?token=${token}`;

        const html = getWelcomeEmailHtml(name, appLink);

        await this.mailService.sendMail({
            to: email,
            subject: 'مرحباً بك في بديهي! فعل حسابك الآن',
            html: html,
        });
    }

    async sendResetPasswordEmail(email: string, name: string, token: string) {
        // App Link for Reset Password
        // Assuming app handles /reset-password?token=...
        const appLink = `https://api.badihy.com/reset-password?token=${token}`;

        const html = getResetPasswordEmailHtml(name, appLink);

        await this.mailService.sendMail({
            to: email,
            subject: 'إعادة تعيين كلمة المرور - بديهي',
            html: html,
        });
    }
}
