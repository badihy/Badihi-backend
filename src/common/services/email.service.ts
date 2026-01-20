import { MailerService } from '@nestjs-modules/mailer';
import { Global, Injectable } from '@nestjs/common';

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
}
