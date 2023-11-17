import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleController } from './google.controller';
import { UserModule } from 'src/user/user.module';
import { GoogleStrategy } from './strategy/google.strategy';
import { TokenModule } from 'src/auth/token/token.module';

@Module({
  imports: [TokenModule, UserModule],
  controllers: [GoogleController],
  providers: [GoogleService, GoogleStrategy],
})
export class GoogleModule {}
