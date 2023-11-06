import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { TokenModule } from '../token/token.module';
import { MailModule } from 'src/mail/mail.module';
import { ForgotController } from './forgot.controller';
import { FogrotService } from './forgot.service';
import { PasswordService } from '../password/password.service';

@Module({
  imports: [UserModule, TokenModule, MailModule],
  controllers: [ForgotController],
  providers: [FogrotService, PasswordService],
  exports: [FogrotService],
})
export class ForgotModule {}
