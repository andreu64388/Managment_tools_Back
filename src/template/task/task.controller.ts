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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth-guard.guard';
import { RolesGuard } from 'src/guards/roles-guard';
import { Roles } from 'src/decorator/roles.decorator';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from 'src/video/video.service';

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly videoService: VideoService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('video'))
  @Post()
  async create(
    @UploadedFile() video: Express.Multer.File,
    @Body() createTaskDto: any,
  ) {
    console.log('work');
    let videoPath = '';
    if (video) {
      videoPath = await this.videoService.uploadFile(video);
    }
    return this.taskService.create(createTaskDto, videoPath);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('video'))
  @Put()
  async update(
    @Body() updateTaskDto: any,
    @UploadedFile() video: Express.Multer.File,
  ) {
    console.log('work');
    let videoPath = '';
    if (video) {
      videoPath = await this.videoService.uploadFile(video);
    }

    return this.taskService.update(updateTaskDto, videoPath);
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

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete('videos/:videoName/:taskId')
  async deleteVideo(
    @Param('videoName') videoName: string,
    @Param('taskId') taskId: string,
  ) {
    try {
      await this.videoService.deleteVideo(videoName);
      const task = await this.taskService.updateVideo(taskId);
      return task;
    } catch (error) {}
  }
}
