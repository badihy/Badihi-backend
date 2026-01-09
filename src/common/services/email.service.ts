import { MailerService } from '@nestjs-modules/mailer';
import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class EmailService {
    constructor(private readonly mailService: MailerService) { }

}
