import { MailerService } from '@nestjs-modules/mailer';
import { Global, Injectable } from '@nestjs/common';
import { getWelcomeEmailHtml } from '../templates/welcome.template';
import { getResetPasswordEmailHtml } from '../templates/reset-password.template';

@Global()
@Injectable()
export class EmailService {
    constructor(private readonly mailService: MailerService) { }

    async sendVerificationEmail(email: string, token: string) {
        const url = `https://api.badihy.com/auth/verify-email?token=${token}`; // Assuming API domain, app will capture 'verify-email' path
        const appLink = `https://api.badihy.com/verify-email?token=${token}`; // This is the URL the app should intercept

        await this.mailService.sendMail({
            to: email,
            subject: 'Verify your email',
            html: `
                <h3>Welcome to Badihi!</h3>
                <p>Please click the link below to verify your email address:</p>
                <a href="${appLink}">Verify Email</a>
                <p>If the link above doesn't work, verify via API: ${url}</p>
            `,
        });
    }

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
