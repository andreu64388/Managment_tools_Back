import { Module, forwardRef } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateModule } from '../template.module';
import { Task } from './entities/task.entity';
import { UserTaskStatus } from './entities/UserTaskStatus.entity';
import { UserModule } from 'src/user/user.module';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, UserTaskStatus]),
    UserModule,
    forwardRef(() => TemplateModule),
    forwardRef(() => PlanModule),
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
