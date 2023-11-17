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

@Controller('templates')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly taskService: TaskService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  async createTemplate(@Body('name') name: string) {
    return this.templateService.create(name);
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
  async GetTempplate(@Param('templateId') templateId: number) {
    return this.templateService.getTemplateById(templateId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':templateId')
  async deleteTemplate(@Param('templateId') templateId: number) {
    const templateInfo = await this.templateService.getTemplateById(templateId);

    const updateTaskPromises = templateInfo.template.tasks.map(async (task) => {
      task.template = null;
      return await this.taskService.update(task);
    });
    await Promise.all(updateTaskPromises);

    return await this.templateService.deleteTemplate(templateId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllTemplates(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Req() req,
  ) {
    console.log('1');
    return this.templateService.getAll(offset, limit, req.user);
  }
}
