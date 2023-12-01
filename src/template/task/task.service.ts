import { Global, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateService } from '../template.service';
import { Task } from './entities/task.entity';
import { User } from 'src/user/entities/user.entity';
import { Plan } from '../plan/entities/plan.entity';
import { UserTaskStatus } from './entities/UserTaskStatus.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DayService } from '../plan/services/day.service';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { VideoService } from 'src/video/video.service';

@Global()
@Injectable()
export class TaskService {
  constructor(
    private readonly templateService: TemplateService,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserTaskStatus)
    private readonly userTaskStatusRepository: Repository<UserTaskStatus>,
    private readonly dayService: DayService,
    private readonly videoService: VideoService,
  ) {}

  async create(createTaskDto: CreateTaskDto, videoPath?: string) {
    try {
      const template = await this.templateService.findById(
        createTaskDto.templateId,
      );

      const task = this.taskRepository.create({
        title: createTaskDto.title,
        duration: createTaskDto.duration,
        descriptions: createTaskDto.descriptions,
        video: videoPath || '',
      });

      task.template = template;

      await this.taskRepository.save(task);

      const transformedTask = this.transformTask(task);
      return transformedTask;
    } catch (error) {
      throw error;
    }
  }

  private transformTask(task: Task) {
    const { title, duration, descriptions, id, video } = task;
    return { title, duration, descriptions, id, video };
  }

  async update(updateTaskDto: UpdateTaskDto, video: string) {
    try {
      const task = await this.taskRepository.findOne({
        where: { id: updateTaskDto.taskId },
      });

      if (!task) {
        throw new ApiError('Task not found', 404);
      }

      task.title = updateTaskDto.title;
      task.duration = updateTaskDto.duration;
      task.descriptions = updateTaskDto.descriptions;
      if (video) {
        task.video = video;
      }

      await this.taskRepository.save(task);
      return task;
    } catch (error) {
      throw error;
    }
  }

  async updateVideo(taskId: string) {
    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
      });

      task.video = null;

      await this.taskRepository.save(task);

      return task;
    } catch (error) {
      throw error;
    }
  }

  async delete(taskId: string) {
    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['days', 'userTaskStatuses'],
      });

      if (!task) {
        throw new ApiError('Task not found', 404);
      }

      if (task.video) {
        await this.videoService.deleteVideo(task.video);
      }

      // await this.dayService.deleteDays(task.days);

      await Promise.all(
        task.userTaskStatuses.map(async (userTaskStatus) => {
          await this.userTaskStatusRepository.remove(userTaskStatus);
        }),
      );

      await this.taskRepository.delete(taskId);

      return { taskId };
    } catch (e) {
      throw e;
    }
  }

  async getTaskById(taskId: string) {
    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
      });

      if (!task) {
        throw new ApiError('Task not found', 404);
      }

      return task;
    } catch (e) {
      throw e;
    }
  }

  async createUserTaskStatuses(
    user: User,
    plan: Plan,
    tasks: Task[],
  ): Promise<UserTaskStatus[]> {
    try {
      const userTaskStatuses: UserTaskStatus[] = [];

      for (const task of tasks) {
        const existingUserTaskStatus =
          await this.userTaskStatusRepository.findOne({
            where: { user, plan, task },
          });

        if (!existingUserTaskStatus) {
          const newUserTaskStatus = new UserTaskStatus();
          newUserTaskStatus.user = user;
          newUserTaskStatus.plan = plan;
          newUserTaskStatus.task = task;
          newUserTaskStatus.completed = false;

          const savedUserTaskStatus =
            await this.userTaskStatusRepository.save(newUserTaskStatus);
          userTaskStatuses.push(savedUserTaskStatus);
        } else {
          userTaskStatuses.push(existingUserTaskStatus);
        }
      }

      return userTaskStatuses;
    } catch (e) {
      throw e;
    }
  }

  async getTaskStatus(planId: string, userId: string, taskId: string) {
    try {
      const userTaskStatus = await this.userTaskStatusRepository.findOne({
        where: {
          plan: { id: planId },
          user: { id: userId },
          task: { id: taskId },
        },
      });

      return userTaskStatus;
    } catch (e) {
      throw e;
    }
  }

  async taskComplted(updateStatusDto: UpdateStatusDto, user: User) {
    try {
      const userTaskStatus = await this.userTaskStatusRepository.findOne({
        where: {
          plan: { id: updateStatusDto.planId },
          user: { id: user.id },
          task: { id: updateStatusDto.taskId },
        },
      });

      if (!userTaskStatus) {
        throw new ApiError('UserTaskStatus not found', 404);
      }
      userTaskStatus.completed = true;

      await this.userTaskStatusRepository.save(userTaskStatus);

      return { taskId: updateStatusDto.taskId };
    } catch (e) {
      throw e;
    }
  }

  async findOne(params: UpdateStatusDto, user: User) {
    try {
      if (!uuidValidate(params.planId)) {
        throw new ApiError('Valid format id', 400);
      }
      const userTaskStatus = await this.userTaskStatusRepository.findOne({
        where: {
          plan: { id: params.planId },
          user: { id: user.id },
          task: { id: params.taskId },
        },
        relations: ['task', 'day', 'day.week'],
      });

      if (!userTaskStatus) {
        throw new ApiError('UserTaskStatus not found', 404);
      }

      userTaskStatus.completed = true;

      return {
        userTaskStatus,
      };
    } catch (e) {
      throw e;
    }
  }

  async removeUserTaskStatuses(planId: string, userId: string) {
    try {
      const userTaskStatuses = await this.userTaskStatusRepository.find({
        where: { plan: { id: planId }, user: { id: userId } },
      });

      await this.userTaskStatusRepository.remove(userTaskStatuses);
    } catch (e) {
      throw e;
    }
  }

  async removeUserTaskStatusesAdmin(planId: string) {
    try {
      const userTaskStatuses = await this.userTaskStatusRepository.find({
        where: { plan: { id: planId } },
      });

      await this.userTaskStatusRepository.remove(userTaskStatuses);
    } catch (e) {
      throw e;
    }
  }
}
