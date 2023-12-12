import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Week } from '../entities/week.entity';
import { Template } from 'src/template/entities/template.entity';
import { DayService } from './day.service';
import { Task } from 'src/template/task/entities/task.entity';
import { ApiError } from 'src/exceptions/ApiError.exception';

@Injectable()
export class WeekService {
  constructor(
    @InjectRepository(Week)
    private readonly weekRepository: Repository<Week>,
    private readonly dayService: DayService,
  ) {}

  async generateWeeks(
    template: Template,
    numWeeks: number,
    countTask: number,
    totalDays: number,
  ): Promise<Week[]> {
    try {
      const tasks = template?.tasks || [];
      const weeks: Week[] = [];
      let currentDay = new Date();
      let taskIndex = 0;

      if (totalDays >= countTask) {
        let distribution = this.solve(totalDays, countTask);

        for (let i = 0; i < numWeeks; i++) {
          const weekTasks: Task[] = [];
          const daysInWeek = Math.min(7, totalDays - i * 7);

          for (let k = 0; k < daysInWeek; k++) {
            const dayIndex = i * 7 + k;
            if (dayIndex < totalDays) {
              if (distribution[dayIndex] > 0) {
                for (let j = 0; j < distribution[dayIndex]; j++) {
                  if (taskIndex < tasks.length) {
                    weekTasks.push(tasks[taskIndex]);
                    taskIndex++;
                  }
                }
              }
            }
          }

          const nonEmptyWeekTasks = weekTasks.filter((task) => task !== null);
          if (nonEmptyWeekTasks.length > 0) {
            const week = this.weekRepository.create({
              days: await this.dayService.generateDays(
                nonEmptyWeekTasks,
                currentDay,
                distribution.slice(i * 7, i * 7 + daysInWeek),
              ),
            });
            weeks.push(week);
          }
          currentDay.setDate(currentDay.getDate() + 7);
        }
      } else {
        let distribution: any = this.fillDistribution(totalDays, countTask);

        for (let i = 0; i < numWeeks; i++) {
          const weekTasks: Task[] = [];
          const daysInWeek = Math.min(7, totalDays - i * 7);

          for (let k = 0; k < daysInWeek; k++) {
            const dayIndex = i * 7 + k;
            if (dayIndex < totalDays) {
              for (let j = 0; j < distribution[dayIndex]; j++) {
                if (taskIndex < tasks.length) {
                  weekTasks.push(tasks[taskIndex]);
                  taskIndex++;
                }
              }
            }
          }

          const nonEmptyWeekTasks = weekTasks.filter((task) => task !== null);
          if (nonEmptyWeekTasks.length > 0) {
            const week = this.weekRepository.create({
              days: await this.dayService.generateDays(
                nonEmptyWeekTasks,
                currentDay,
                distribution.slice(i * 7, i * 7 + daysInWeek),
              ),
            });
            weeks.push(week);
          }

          currentDay.setDate(currentDay.getDate() + 7);
        }
      }

      return weeks;
    } catch (e) {
      throw new ApiError('Failed to generate weeks', 500);
    }
  }
  fillDistribution(totalDays: number, countTask: number) {
    let distribution: any = Array.from({ length: totalDays }).fill(0);
    let remainingTasks = countTask;

    for (let i = 0; i < remainingTasks; i++) {
      distribution[i % totalDays]++;
    }

    return distribution;
  }

  async deleteWeeks(weeks: Week[]): Promise<void> {
    try {
      for (const week of weeks) {
        await this.dayService.deleteDays(week.days);
        await this.weekRepository.delete(week.id);
      }
    } catch (e) {
      throw new ApiError('Failed to delete weeks', 500);
    }
  }
  solve(arraySize: number, oneCount: number) {
    let newArray = Array(arraySize).fill(0);
    let low = 0,
      high = arraySize;
    let gap = 0;
    while (low <= high) {
      let mid = (low + high) >> 1;
      if (mid * (oneCount - 1) < arraySize) {
        gap = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    let needsEvenDivision = oneCount > arraySize >> 1 && gap === 1;
    gap = needsEvenDivision ? 2 : gap;
    let idx = 0;
    while (idx < arraySize && oneCount > 0) {
      newArray[idx] = 1;
      oneCount--;
      if (needsEvenDivision && arraySize - idx - 2 < oneCount) gap = 1;
      idx += gap;
    }

    return newArray;
  }
}
