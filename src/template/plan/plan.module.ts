import { Module, forwardRef } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeekService } from './services/week.service';
import { DayService } from './services/day.service';
import { UserModule } from 'src/user/user.module';
import { TemplateModule } from '../template.module';
import { Plan } from './entities/plan.entity';
import { Week } from './entities/week.entity';
import { Day } from './entities/day.entity';
import { TaskModule } from '../task/task.module';
import { UserTaskStatus } from '../task/entities/UserTaskStatus.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan]),
    TypeOrmModule.forFeature([Day]),
    TypeOrmModule.forFeature([Week]),
    TypeOrmModule.forFeature([UserTaskStatus]),
    UserModule,
    forwardRef(() => TaskModule),
    forwardRef(() => TemplateModule),
  ],

  controllers: [PlanController],
  providers: [PlanService, WeekService, DayService],
  exports: [PlanService, WeekService, DayService],
})
export class PlanModule {}
