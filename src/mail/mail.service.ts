import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}
  async sendUserConfirmation(user: User, token: string) {
    const originalToken = token.replace(/\./g, '+');
    console.log(originalToken);
    const url = `http://localhost:3000/forgot_password/${originalToken}`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      template: './confirmation',
      context: {
        email: user.email,
        url,
      },
    });
  }
}
