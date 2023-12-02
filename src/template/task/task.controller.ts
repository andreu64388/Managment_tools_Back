import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
  Req,
  Delete,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth-guard.guard';
import { RolesGuard } from 'src/guards/roles-guard';
import { Roles } from 'src/decorator/roles.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put()
  async update(@Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(updateTaskDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':taskId')
  delete(@Param('taskId') taskId: string) {
    return this.taskService.delete(taskId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('done')
  done(@Body() updateStatusDto: UpdateStatusDto, @Request() req) {
    return this.taskService.taskComplted(updateStatusDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':planId/:taskId')
  async taskCompleted(@Param() params: UpdateStatusDto, @Req() req) {
    const user = req.user;
    return this.taskService.findOne(params, user);
  }
}
