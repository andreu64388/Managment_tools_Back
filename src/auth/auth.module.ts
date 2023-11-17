import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from './password/password.service';
import { TokenModule } from './token/token.module';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { ForgotModule } from './forgot/forgot.module';
import { AuthController } from './auth.controller';
import { GoogleModule } from './socials/google/google.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule,
    TokenModule,
    MailModule,
    ForgotModule,
    GoogleModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
})
export class AuthModule {}
