import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateService } from '../template.service';
import {
  addDays,
  differenceInDays,
  isToday,
  isTomorrow,
  format,
} from 'date-fns';
import { WeekService } from './services/week.service';
import { Plan } from './entities/plan.entity';
import { User } from 'src/user/entities/user.entity';
import { TaskService } from '../task/task.service';
import { ApiError } from 'src/exceptions/ApiError.exception';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly templateService: TemplateService,
    private readonly weekService: WeekService,
    private readonly taskService: TaskService,
  ) {}

  async create(createPlanDto: CreatePlanDto, user: User) {
    try {
      const template = await this.templateService.findById(
        createPlanDto.templateId,
      );
      template.tasks = template.tasks.sort((a, b) => a.id - b.id);

      const parsedDeadline = new Date(createPlanDto.deadline);

      if (isNaN(parsedDeadline.getTime())) {
        throw new ApiError('Invalid date format', 400);
      }

      const startDate = new Date();

      if (parsedDeadline <= startDate) {
        throw new ApiError('Selected date must be in the future', 400);
      }

      const prepTime = template.prepTime || 0;

      const minAllowedDate = addDays(startDate, prepTime);

      if (parsedDeadline < minAllowedDate) {
        throw new ApiError(
          `You must wait at least until ${format(
            minAllowedDate,
            'yyyy-MM-dd',
          )} before selecting this date`,
          400,
        );
      }

      const totalDays = differenceInDays(parsedDeadline, startDate) + 1;

      const minimumDaysRequired = prepTime;

      if (totalDays < minimumDaysRequired) {
        throw new ApiError(
          `Minimum days required for this plan is ${minimumDaysRequired}`,
          400,
        );
      }

      const numWeeks = Math.floor(totalDays / 7) + (totalDays % 7 >= 1 ? 1 : 0);
      const countTask = template.tasks.length;

      const maxTasksAllowed = prepTime * 2;

      if (totalDays > maxTasksAllowed) {
        throw new ApiError(
          `Maximum ${maxTasksAllowed} days allowed in the plan`,
          400,
        );
      }

      const plan = this.planRepository.create({
        deadline: parsedDeadline,
        user,
        template,
        startDate,
      });

      const weeks = await this.weekService.generateWeeks(
        template,
        numWeeks,
        countTask,
        totalDays,
      );
      plan.weeks = weeks;

      const allTasks = template.tasks || [];

      const userTaskStatuses = await this.taskService.createUserTaskStatuses(
        user,
        plan,
        allTasks,
      );
      plan.userTaskStatuses = userTaskStatuses;

      await this.planRepository.save(plan);

      const populatedPlan = await this.planRepository.findOneOrFail({
        where: { id: plan.id },
        relations: ['weeks', 'weeks.days', 'weeks.days.task'],
      });

      return populatedPlan;
    } catch (error) {
      throw error;
    }
  }

  async getCompletedPlansByUserId(
    user: User,
    offset: number = 0,
    limit: number = 5,
  ) {
    try {
      const plans = await this.planRepository.find({
        where: { user: { id: user.id } },
        relations: ['weeks', 'weeks.days', 'weeks.days.task', 'template'],
        order: { deadline: 'ASC' },
      });

      const completedPlans = [];

      await Promise.all(
        plans.map(async (plan) => {
          const modernPlan = await this.transformPlan(plan);

          const filteredModernPlan = modernPlan.filter(
            (week) => week.days.length > 0,
          );

          const totalTasks = filteredModernPlan
            .flatMap((week) => week.days)
            .filter(
              (day) => day.task && day.task.completed !== undefined,
            ).length;

          if (totalTasks === 0) {
            return;
          }

          const completedTasks = filteredModernPlan
            .flatMap((week) => week.days)
            .filter((day) => day.task && day.task.completed === true).length;

          const planInfo = {
            id: plan.id,
            name: totalTasks > 0 ? plan.template?.name || null : null,
            deadline: plan.deadline,
            totalTasks,
          };

          if (completedTasks === totalTasks) {
            completedPlans.push(planInfo);
          }
        }),
      );

      const startIndex = Number(offset);
      const endIndex = Number(offset) + Number(limit);
      const slicedPlans = completedPlans.slice(startIndex, endIndex);

      return slicedPlans;
    } catch (error) {
      throw error;
    }
  }

  async getUncompletedPlansByUserId(
    user: User,
    offset: number = 0,
    limit: number = 5,
  ) {
    try {
      const plans = await this.planRepository.find({
        where: { user: { id: user.id } },
        relations: ['weeks', 'weeks.days', 'weeks.days.task', 'template'],
        order: { deadline: 'ASC' },
      });

      const uncompletedPlans = [];
      const today = new Date();

      await Promise.all(
        plans.map(async (plan) => {
          const modernPlan = await Promise.all(
            plan.weeks.map(async (week) => {
              const modernWeek = await Promise.all(
                week.days.map(async (day) => {
                  const taskStatus = await this.taskService.getTaskStatus(
                    plan?.id,
                    plan?.user?.id,
                    day?.task?.id,
                  );
                  const completed =
                    taskStatus && taskStatus.completed !== undefined
                      ? taskStatus.completed
                      : false;

                  const isValidTask =
                    day.task &&
                    day.task.id !== undefined &&
                    day.task.title !== undefined;

                  if (!isValidTask) {
                    return null;
                  }

                  return {
                    ...day,
                    task: {
                      ...day.task,
                      completed,
                    },
                  };
                }),
              );

              const filteredWeek = modernWeek.filter((day) => day !== null);

              return {
                ...week,
                days: filteredWeek,
              };
            }),
          );

          const filteredModernPlan = modernPlan.filter(
            (week) => week.days.length > 0,
          );

          const totalTasks = filteredModernPlan
            .flatMap((week) => week.days)
            .filter(
              (day) => day.task && day.task.completed !== undefined,
            ).length;

          if (totalTasks === 0) {
            return;
          }

          const upcomingTasks = filteredModernPlan
            .flatMap((week) => week.days)
            .filter(
              (day) =>
                day.task &&
                day.task.completed !== undefined &&
                !day.task.completed &&
                (isToday(new Date(day.dayNumber)) ||
                  new Date(day.dayNumber) > today),
            )
            .sort((a, b) =>
              differenceInDays(new Date(a.dayNumber), new Date(b.dayNumber)),
            );

          const upcomingTask =
            upcomingTasks.length > 0 ? upcomingTasks[0] : null;

          const completedTasks = filteredModernPlan
            .flatMap((week) => week.days)
            .filter((day) => day.task && day.task.completed === true).length;

          const nearestDateTask = filteredModernPlan
            .flatMap((week) => week.days)
            .filter(
              (day) =>
                day.task &&
                day.task.completed !== undefined &&
                !day.task.completed &&
                (isToday(new Date(day.dayNumber)) ||
                  new Date(day.dayNumber) > today),
            )
            .sort((a, b) =>
              differenceInDays(new Date(a.dayNumber), new Date(b.dayNumber)),
            )
            .pop();

          const planInfo = {
            id: plan.id,
            name: totalTasks > 0 ? plan.template?.name || null : null,
            deadline: plan.deadline,
            totalTasks,
            upcomingTask,
          };

          if (completedTasks !== totalTasks) {
            uncompletedPlans.push(planInfo);
          }
        }),
      );

      const startIndex = Number(offset);

      const endIndex = Number(offset) + Number(limit);

      const slicedPlans = uncompletedPlans.slice(startIndex, endIndex);

      return slicedPlans;
    } catch (error) {
      throw error;
    }
  }

  private async transformPlan(plan: any) {
    const modernPlan = await Promise.all(
      plan.weeks.map(async (week) => {
        const modernWeek = await Promise.all(
          week.days.map(async (day) => {
            const taskStatus = await this.taskService.getTaskStatus(
              plan?.id,
              plan?.user?.id,
              day?.task?.id,
            );
            const completed =
              taskStatus && taskStatus.completed !== undefined
                ? taskStatus.completed
                : false;

            const isValidTask =
              day.task &&
              day.task.id !== undefined &&
              day.task.title !== undefined;

            if (!isValidTask) {
              return null;
            }

            return {
              ...day,
              task: {
                ...day.task,
                completed,
              },
            };
          }),
        );

        const filteredWeek = modernWeek.filter((day) => day !== null);

        return {
          ...week,
          days: filteredWeek,
        };
      }),
    );

    return modernPlan;
  }

  async getPlanById(planId: number, user: User) {
    try {
      const plan = await this.planRepository.findOne({
        where: { id: planId, user: { id: user.id } },
        relations: ['weeks', 'weeks.days', 'weeks.days.task', 'template'],
      });

      if (!plan) throw new ApiError('Plan not found', 404);

      const modernPlan = await Promise.all(
        plan.weeks.map(async (week) => {
          const modernWeek = await Promise.all(
            week.days.map(async (day) => {
              const taskStatus = await this.taskService.getTaskStatus(
                plan?.id,
                plan?.user?.id,
                day?.task?.id,
              );

              const completed =
                taskStatus && taskStatus.completed !== undefined
                  ? taskStatus.completed
                  : false;

              const isValidTask =
                day.task &&
                day.task.id !== undefined &&
                day.task.title !== undefined;

              if (!isValidTask) {
                return null;
              }

              return {
                ...day,
                task: {
                  ...day.task,
                  completed,
                },
              };
            }),
          );

          const filteredWeek = modernWeek.filter((day) => day !== null);
          return {
            ...week,
            days: filteredWeek,
          };
        }),
      );

      const filteredModernPlan = modernPlan.filter(
        (week) => week.days.length > 0,
      );

      const today = new Date();
      const daysLeft = Math.ceil(
        (new Date(plan.deadline).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const totalDays = plan.startDate
        ? differenceInDays(new Date(plan.deadline), new Date(plan.startDate)) +
          1
        : daysLeft;

      const totalTasks = filteredModernPlan
        .flatMap((week) => week.days)
        .filter((day) => day.task && day.task.completed !== undefined).length;

      const completedTasks = filteredModernPlan
        .flatMap((week) => week.days)
        .filter((day) => day.task && day.task.completed === true).length;

      const upcomingTask = filteredModernPlan
        .flatMap((week) => week.days)
        .find(
          (day) =>
            day.task &&
            day.task.completed !== undefined &&
            !day.task.completed &&
            (isToday(new Date(day.dayNumber)) ||
              isTomorrow(new Date(day.dayNumber))),
        );

      return {
        startDate: plan.startDate,
        deadline: plan.deadline,
        title: plan?.template?.name,
        planId,
        daysLeft,
        totalDays,
        totalTasks,
        completedTasks,
        upcomingTask,
        weeks: filteredModernPlan,
      };
    } catch (error) {
      throw error;
    }
  }

  async removeTaskFromPlan(planId: number, taskId: number, user: User) {
    try {
      const plan = await this.planRepository.findOne({
        where: { id: planId, user: { id: user.id } },
        relations: ['weeks', 'weeks.days', 'weeks.days.task'],
      });

      if (!plan) {
        throw new ApiError('Plan not found', 404);
      }

      let taskFound = false;

      plan.weeks.forEach((week) => {
        week.days.forEach((day, index) => {
          if (day.task?.id === taskId) {
            week.days.splice(index, 1);
            taskFound = true;
          }
        });
      });

      if (!taskFound) {
        throw new ApiError('Task not found in the plan', 404);
      }

      await this.planRepository.save(plan);
      return taskId;
    } catch (error) {
      throw error;
    }
  }

  async removePlan(planId: number, user: User) {
    try {
      const plan = await this.planRepository.findOne({
        where: { id: planId },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.task',
          'userTaskStatuses',
        ],
      });

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      await this.weekService.deleteWeeks(plan.weeks);
      await this.taskService.removeUserTaskStatuses(plan.id, user.id);
      await this.planRepository.remove(plan);
      return planId;
    } catch (error) {
      throw error;
    }
  }

  async removePlanAdmin(planId: number) {
    try {
      const plan = await this.planRepository.findOne({
        where: { id: planId },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.task',
          'userTaskStatuses',
        ],
      });

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      await this.weekService.deleteWeeks(plan.weeks);
      await this.taskService.removeUserTaskStatusesAdmin(plan.id);
      await this.planRepository.remove(plan);
    } catch (error) {
      throw error;
    }
  }

  async getTask(planId: number, taskId: number, user: User) {
    try {
      const plan = await this.planRepository.findOne({
        where: {
          id: planId,
          user: { id: user.id },
        },
        relations: ['weeks', 'weeks.days', 'weeks.days.task'],
      });

      if (!plan) {
        throw new ApiError('Plan not found', 404);
      }

      let foundTask = null;
      for (const [index, week] of plan.weeks.entries()) {
        for (const day of week.days) {
          if (day.task?.id === taskId) {
            const taskStatus = await this.taskService.getTaskStatus(
              plan?.id,
              plan?.user?.id,
              day?.task?.id,
            );

            foundTask = {
              task: { ...day.task, complteted: taskStatus.completed },
              weekOrder: index + 1,
              day: day.dayNumber,
            };
          }
        }
      }
      if (!foundTask) {
        throw new ApiError('Task not found in the plan', 404);
      }

      return foundTask;
    } catch (error) {
      throw error;
    }
  }
}
