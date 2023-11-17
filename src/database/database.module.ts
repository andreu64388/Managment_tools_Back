import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from 'src/auth/token/entities/token.entity';
import { Role } from 'src/role/entities/role.entity';
import { Template } from 'src/template/entities/template.entity';
import { Day } from 'src/template/plan/entities/day.entity';
import { Plan } from 'src/template/plan/entities/plan.entity';
import { Week } from 'src/template/plan/entities/week.entity';
import { UserTaskStatus } from 'src/template/task/entities/UserTaskStatus.entity';
import { Task } from 'src/template/task/entities/task.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [
          User,
          Token,
          Role,
          Template,
          Task,
          Plan,
          Week,
          Day,
          Task,
          UserTaskStatus,
        ],
        ssl: { rejectUnauthorized: false }, // Добавьте эту строку для отключения проверки сертификата. Это не рекомендуется в боевой среде.
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseeModule {}
