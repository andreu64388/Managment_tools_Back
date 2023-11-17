import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { DatabaseeModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { RoleModule } from './role/role.module';
import { AdminModule } from './admin/admin.module';
import { TemplateModule } from './template/template.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    DatabaseeModule,
    MailModule,
    RoleModule,
    AuthModule,
    AdminModule,
    TemplateModule,
  ],
})
export class AppModule {}
