import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from './password/password.service';
import { TokenModule } from './token/token.module';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { ForgotController } from './forgot/forgot.controller';
import { ForgotModule } from './forgot/forgot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule,
    TokenModule,
    MailModule,
    ForgotModule,
  ],
  providers: [AuthService, PasswordService],
})
export class AuthModule {}
