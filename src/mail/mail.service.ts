import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}
  async sendUserConfirmation(user: User, token: string) {
    try {
      const originalToken = token.replace(/\./g, '+');
      const baseUrl = this.configService.get<string>('BASE_URL');
      const url = `${baseUrl}/forgot_password/${originalToken}`;

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        template: './confirmation',
        context: {
          email: user.email,
          url,
        },
      });
    } catch (e) {
      throw new ApiError('Failed to send email', 500);
    }
  }
}
