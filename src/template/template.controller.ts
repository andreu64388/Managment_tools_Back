import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Param,
  Put,
  Delete,
  Req,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth-guard.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { RolesGuard } from 'src/guards/roles-guard';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TaskService } from './task/task.service';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { PlanService } from './plan/plan.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('templates')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly taskService: TaskService,
    private readonly planService: PlanService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templateService.create(createTemplateDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put()
  async updateTemplate(@Body() updateTemplateTemplate: UpdateTemplateDto) {
    return this.templateService.update(updateTemplateTemplate);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':templateId')
  async GetTemplate(@Param('templateId') templateId: string) {
    return this.templateService.getTemplateById(templateId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('/tasks/:templateId')
  async GetTemplateTasks(
    @Param('templateId') templateId: string,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    return this.templateService.getTaskByTemplateId(templateId, offset, limit);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':templateId')
  async deleteTemplate(@Param('templateId') templateId: string) {
    try {
      const templateInfo =
        await this.templateService.findTemplateByIdWithRelations(templateId);

      await Promise.all(
        templateInfo.tasks.map(async (task) => {
          await this.taskService.delete(task.id);
        }),
      );

      await Promise.all(
        templateInfo.plans.map(async (plan) => {
          await this.planService.removePlanAdmin(plan.id);
        }),
      );
      return await this.templateService.deleteTemplate(templateId);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllTemplates(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Req() req,
  ) {
    return this.templateService.getAll(offset, limit, req.user);
  }
}
