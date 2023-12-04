import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateService } from '../template.service';
import { addMinutes, differenceInDays, isToday } from 'date-fns';
import { WeekService } from './services/week.service';
import { Plan } from './entities/plan.entity';
import { User } from 'src/user/entities/user.entity';
import { TaskService } from '../task/task.service';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { validate as uuidValidate } from 'uuid';

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
      template.tasks = template.tasks.sort((a, b) => {
        const dateA = a.createAt.getTime();
        const dateB = b.createAt.getTime();
        return dateA - dateB;
      });

      const parsedDeadline = new Date(createPlanDto.deadline);

      if (isNaN(parsedDeadline.getTime())) {
        throw new ApiError('Invalid date format', 400);
      }

      const startDate = new Date();

      if (parsedDeadline <= startDate) {
        throw new ApiError('Selected date must be in the future', 400);
      }
      const prepTimeInMinutes = template.prepTime;

      const minStartDate = addMinutes(startDate, prepTimeInMinutes);

      if (parsedDeadline <= minStartDate) {
        throw new ApiError('Selected date must be after prepTime', 400);
      }
      const totalDays = differenceInDays(parsedDeadline, startDate) + 1;

      const countTask = template.tasks.length;
      let tasksPerDay: number;

      if (totalDays >= countTask) {
        tasksPerDay = 1;
      } else {
        tasksPerDay = Math.ceil(countTask / totalDays);
      }

      tasksPerDay = Math.min(tasksPerDay, totalDays);

      const plan = this.planRepository.create({
        deadline: parsedDeadline,
        user,
        template,
        startDate,
      });

      const numWeeks = Math.floor(totalDays / 7) + (totalDays % 7 >= 1 ? 1 : 0);

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
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
        ],
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
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
          'template',
        ],
        order: { deadline: 'ASC' },
      });

      const completedPlans = await Promise.all(
        plans.map(async (plan) => {
          const modernPlan = await this.transformPlans(plan);

          const filteredModernPlan = modernPlan.filter(
            (week) => week.days.length > 0,
          );

          const totalTasks = new Set<string>();

          filteredModernPlan
            .flatMap((week) => week.days)
            .forEach((day) => {
              day.tasks.forEach((task) => {
                totalTasks.add(task.id);
              });
            });

          if (totalTasks.size === 0) {
            return null;
          }

          const completedTasks = filteredModernPlan
            .flatMap((week) => week.days)
            .reduce(
              (acc, day) =>
                acc +
                (day.tasks
                  ? day.tasks.filter((task) => task.completed === true).length
                  : 0),
              0,
            );

          const planInfo = {
            id: plan.id,
            name: totalTasks.size > 0 ? plan.template?.name || null : null,
            deadline: plan.deadline,
            totalTasks: totalTasks.size,
          };

          if (completedTasks === totalTasks.size) {
            return planInfo;
          }

          return null;
        }),
      );

      const validCompletedPlans = completedPlans.filter(
        (completedPlan) => completedPlan !== null,
      );

      const startIndex = Number(offset);
      const endIndex = Number(offset) + Number(limit);
      const slicedPlans = validCompletedPlans.slice(startIndex, endIndex);

      return slicedPlans;
    } catch (error) {
      throw error;
    }
  }

  private async transformPlans(plan: any) {
    const modernPlan = await Promise.all(
      plan.weeks.map(async (week) => {
        const modernWeek = await Promise.all(
          week.days.map(async (day) => {
            const modernTasks = await Promise.all(
              (day.dayTasks || []).map(async (dayTask) => {
                const taskStatus = await this.taskService.getTaskStatus(
                  plan?.id,
                  plan?.user?.id,
                  dayTask?.task?.id,
                );
                const completed =
                  taskStatus && taskStatus.completed !== undefined
                    ? taskStatus.completed
                    : false;

                const isValidTask =
                  dayTask.task &&
                  dayTask.task.id !== undefined &&
                  dayTask.task.title !== undefined;

                if (!isValidTask) {
                  return null;
                }

                return {
                  ...dayTask.task,
                  completed,
                };
              }),
            );

            const isValidDay =
              day.id !== undefined && day.dayNumber !== undefined;

            if (!isValidDay) {
              return null;
            }

            const transformedTasks = modernTasks.filter(
              (task) => task !== null && task.completed === true,
            );

            return {
              ...day,
              tasks: transformedTasks,
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

  private async transformPlansUn(plan: any) {
    const modernPlan = await Promise.all(
      plan.weeks.map(async (week) => {
        const modernWeek = await Promise.all(
          week.days.map(async (day) => {
            const modernTasks = await Promise.all(
              (day.dayTasks || []).map(async (dayTask) => {
                const taskStatus = await this.taskService.getTaskStatus(
                  plan?.id,
                  plan?.user?.id,
                  dayTask?.task?.id,
                );
                const completed =
                  taskStatus && taskStatus.completed !== undefined
                    ? taskStatus.completed
                    : false;

                const isValidTask =
                  dayTask.task &&
                  dayTask.task.id !== undefined &&
                  dayTask.task.title !== undefined;

                if (!isValidTask) {
                  return null;
                }

                return {
                  ...dayTask.task,
                  completed,
                };
              }),
            );

            const isValidDay =
              day.id !== undefined && day.dayNumber !== undefined;

            if (!isValidDay) {
              return null;
            }

            const transformedTasks = modernTasks.filter(
              (task) => task !== null && task.completed === false, // Include only incomplete tasks
            );

            return {
              ...day,
              tasks: transformedTasks,
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

  async getUncompletedPlansByUserId(
    user: User,
    offset: number = 0,
    limit: number = 5,
  ) {
    try {
      const plans = await this.planRepository.find({
        where: { user: { id: user.id } },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
          'template',
        ],
        order: { deadline: 'ASC' },
      });

      const uncompletedPlans = [];
      const today = new Date();

      await Promise.all(
        plans.map(async (plan) => {
          const modernPlan = await this.transformPlansUn(plan);

          const filteredModernPlan = modernPlan.filter(
            (week) => week.days.length > 0,
          );

          const totalTasks = new Set<string>();

          filteredModernPlan
            .flatMap((week) => week.days)
            .forEach((day) => {
              day.tasks.forEach((task) => {
                totalTasks.add(task.id);
              });
            });

          if (totalTasks.size === 0) {
            return;
          }

          const completedTasks = filteredModernPlan
            .flatMap((week) => week.days)
            .filter(
              (day) =>
                day.tasks &&
                day.tasks.length > 0 &&
                day.tasks[0].completed === true,
            ).length;

          // Fix the condition to filter uncompleted plans
          if (completedTasks === 0 && totalTasks.size > 0) {
            const upcomingTasks = filteredModernPlan
              .flatMap((week) => week.days)
              .filter(
                (day) =>
                  day.tasks &&
                  day.tasks.length > 0 &&
                  !day.tasks[0].completed &&
                  (isToday(new Date(day.dayNumber)) ||
                    new Date(day.dayNumber) > today),
              )
              .sort((a, b) =>
                differenceInDays(new Date(a.dayNumber), new Date(b.dayNumber)),
              );

            const uncompletedTask =
              upcomingTasks.length > 0 ? upcomingTasks[0]?.tasks[0] : null;

            const planInfo = {
              id: plan.id,
              name: totalTasks.size > 0 ? plan.template?.name || null : null,
              deadline: plan.deadline,
              totalTasks: totalTasks.size,
              upcomingTask: uncompletedTask,
            };

            uncompletedPlans.push(planInfo);
          }
        }),
      );

      const sortedUncompletedPlans = uncompletedPlans.sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );

      const startIndex = Number(offset);
      const endIndex = Number(offset) + Number(limit);
      const slicedPlans = sortedUncompletedPlans.slice(startIndex, endIndex);

      return slicedPlans;
    } catch (error) {
      throw error;
    }
  }
  async findUpcomingTask(weeks: any[]): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let upcomingTask = null;

    for (const week of weeks) {
      for (const day of week.days) {
        const dayDate = new Date(day.dayNumber);

        dayDate.setHours(0, 0, 0, 0);

        if (dayDate >= today && dayDate < tomorrow) {
          if (day.task && day.task.completed === false) {
            upcomingTask = {
              dayNumber: day.dayNumber,
              task: day.task,
            };

            break;
          }
        }
      }

      if (upcomingTask) {
        break;
      }
    }

    return upcomingTask;
  }

  async getPlanById(planId: string, user: User) {
    try {
      if (!uuidValidate(planId)) {
        throw new ApiError('Valid format id', 400);
      }

      const plan = await this.planRepository.findOne({
        where: { id: planId, user: { id: user.id } },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
          'template',
        ],
      });

      if (!plan) throw new ApiError('Plan not found', 404);

      const transformedWeeks = await Promise.all(
        (plan.weeks || [])
          .filter((week) => week.days && week.days.length > 0)
          .map(async (week) => {
            const transformedDays = await Promise.all(
              (week.days || [])
                .filter((day) => day.dayTasks && day.dayTasks.length > 0)
                .flatMap(async (day: any) => {
                  const transformedTasks = await Promise.all(
                    (day.dayTasks || [])
                      .filter((dayTask: any) => dayTask.task !== undefined)
                      .map(async (dayTask: any) => {
                        const taskStatus = await this.taskService.getTaskStatus(
                          plan?.id,
                          plan?.user?.id,
                          dayTask?.task?.id,
                        );
                        const completed =
                          taskStatus && taskStatus.completed !== undefined
                            ? taskStatus.completed
                            : false;

                        return {
                          id: dayTask.task.id,
                          dayNumber: day.dayNumber,
                          task: {
                            ...(dayTask.task || {}),
                            completed,
                          },
                        };
                      }),
                  );

                  const transformedDaysForTasks = transformedTasks
                    .filter((task) => task && task.dayNumber !== undefined)
                    .map((task) => ({
                      dayNumber: task.dayNumber,
                      task: task.task,
                    }));

                  const sortedTransformedDays = transformedDaysForTasks.sort(
                    (a, b) =>
                      a.dayNumber !== undefined && b.dayNumber !== undefined
                        ? new Date(a.dayNumber).getTime() -
                          new Date(b.dayNumber).getTime()
                        : 0,
                  );

                  return sortedTransformedDays;
                }),
            );

            const transformedDaysFlat = transformedDays.flat();

            const sortedTransformedDaysFlat = transformedDaysFlat
              .filter((item) => item && item.dayNumber !== undefined)
              .sort((a, b) =>
                a.dayNumber !== undefined && b.dayNumber !== undefined
                  ? new Date(a.dayNumber).getTime() -
                    new Date(b.dayNumber).getTime()
                  : 0,
              );

            const earliestDayNumber =
              sortedTransformedDaysFlat.length > 0
                ? sortedTransformedDaysFlat[0].dayNumber
                : null;

            return {
              id: week.id,
              days: sortedTransformedDaysFlat,
              earliestDayNumber,
            };
          }),
      );

      const flatTransformedWeeks = transformedWeeks.flat().filter(Boolean); // Фильтрация undefined

      let sortedWeeks = flatTransformedWeeks.sort(
        (a, b) =>
          a.earliestDayNumber - b.earliestDayNumber ||
          (a.days[0]?.dayNumber !== undefined &&
          b.days[0]?.dayNumber !== undefined
            ? new Date(a.days[0].dayNumber).getTime() -
              new Date(b.days[0].dayNumber).getTime()
            : 0),
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

      const totalTasks = flatTransformedWeeks
        .flatMap((day) => day.days)
        .filter(
          (task) => task && task.task && task.task.completed !== undefined,
        ).length;

      const completedTasks = flatTransformedWeeks
        .flatMap((day) => day.days)
        .filter(
          (task) => task && task.task && task.task.completed === true,
        ).length;

      const upcomingTask = await this.findUpcomingTask(flatTransformedWeeks);

      if (
        sortedWeeks.length === 0 ||
        sortedWeeks.every((week) => week.days.length === 0)
      ) {
        sortedWeeks = null;
      }

      const filteredSortedWeeks = sortedWeeks?.filter(
        (week) => week.days.length > 0,
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
        weeks: filteredSortedWeeks,
      };
    } catch (error) {
      throw error;
    }
  }

  async removeTaskFromPlan(planId: string, taskId: string, user: User) {
    try {
      const plan = await this.planRepository.findOne({
        where: { id: planId, user: { id: user.id } },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
        ],
      });

      if (!plan) {
        throw new ApiError('Plan not found', 404);
      }

      let taskFound = false;
      const updatedWeeks = plan.weeks.map((week: any) => ({
        ...week,
        days: week.days.map((day) => {
          const updatedTasks = (day.dayTasks || [])
            .map((dayTask) => {
              if (dayTask.task.id === taskId) {
                taskFound = true;
                return null;
              }
              return dayTask;
            })
            .filter(Boolean);

          return {
            ...day,
            dayTasks: updatedTasks,
          };
        }),
      }));

      if (!taskFound) {
        throw new ApiError('Task not found in the plan', 404);
      }
      const updatedPlan = { ...plan, weeks: updatedWeeks };

      await this.planRepository.save(updatedPlan);

      return { taskId };
    } catch (error) {
      throw error;
    }
  }

  async removePlan(planId: string, user: User) {
    try {
      const plan = await this.planRepository.findOne({
        where: { id: planId },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
          'userTaskStatuses',
        ],
      });

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }
      await this.weekService.deleteWeeks(plan.weeks);

      await this.taskService.removeUserTaskStatuses(plan.id, user.id);
      await this.planRepository.remove(plan);

      return { planId };
    } catch (error) {
      throw error;
    }
  }

  async removePlanAdmin(planId: string) {
    try {
      const plan = await this.planRepository.findOne({
        where: { id: planId },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
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

  async getTask(planId: string, taskId: string, user: User) {
    try {
      if (!uuidValidate(planId) || !uuidValidate(taskId)) {
        throw new ApiError('Valid format id', 400);
      }

      const plan = await this.planRepository.findOne({
        where: {
          id: planId,
          user: { id: user.id },
        },
        relations: [
          'weeks',
          'weeks.days',
          'weeks.days.dayTasks',
          'weeks.days.dayTasks.task',
        ],
      });

      if (!plan) {
        throw new ApiError('Plan not found', 404);
      }

      let foundTask = null;

      for (const [index, week] of plan.weeks.entries()) {
        for (const day of week.days) {
          const task: any = day?.dayTasks?.find(
            (dayTask: any) => dayTask.task.id === taskId,
          );

          if (task) {
            const taskStatus = await this.taskService.getTaskStatus(
              plan?.id,
              plan?.user?.id,
              task?.task?.id,
            );

            foundTask = {
              task: {
                ...task.task,
                completed: taskStatus?.completed || false,
              },
              weekOrder: index + 1,
              day: day.dayNumber,
            };
            break;
          }
        }
        if (foundTask) {
          break;
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
