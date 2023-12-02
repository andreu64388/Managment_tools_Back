import { Module, forwardRef } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { TaskModule } from './task/task.module';
import { PlanModule } from './plan/plan.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template]),
    PlanModule,
    forwardRef(() => TaskModule),
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
