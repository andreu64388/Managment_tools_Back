import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Day } from '../entities/day.entity';
import { Task } from 'src/template/task/entities/task.entity';
import { addDays } from 'date-fns';
import { DayTask } from './../entities/dayTask';
import { TaskService } from 'src/template/task/task.service';

@Injectable()
export class DayService {
  constructor(
    @InjectRepository(Day)
    private readonly dayRepository: Repository<Day>,
    @InjectRepository(DayTask)
    private readonly dayTaskRepository: Repository<DayTask>,
  ) {}

  async generateDays(
    tasks: Task[],
    startDate: Date,
    countTaskDistribution: number[],
  ): Promise<Day[]> {
    const days: Day[] = [];
    let taskIndex = 0;
    try {
      for (let i = 0; i < countTaskDistribution.length; i++) {
        const currentDay = new Date(startDate); // Create a new date to avoid reference issues
        currentDay.setDate(currentDay.getDate() + i);

        const dayTasks: Task[] = [];
        for (let j = 0; j < countTaskDistribution[i]; j++) {
          if (taskIndex < tasks.length) {
            dayTasks.push(tasks[taskIndex]);
            taskIndex++;
          }
        }

        if (dayTasks.length > 0) {
          const day = this.dayRepository.create({
            dayNumber: currentDay,
          });

          const savedDay = await this.dayRepository.save(day);
          days.push(savedDay);

          await Promise.all(
            dayTasks.map(async (task) => {
              const dayTask = this.dayTaskRepository.create({
                day: savedDay,
                task,
              });
              await this.dayTaskRepository.save(dayTask);
            }),
          );
        }
      }

      return days;
    } catch (error) {
      throw new Error('Failed to generate days');
    }
  }

  async GetTaskByDayTaskId(day: Day) {
    try {
      const dayTasks = await this.dayTaskRepository.find({
        where: { day: day },
        relations: ['task'],
      });

      return dayTasks;
    } catch (error) {
      throw new Error('Failed to get day tasks');
    }
  }

  async deleteDayTasks(dayTasks: DayTask[]): Promise<void> {
    try {
      const dayTaskIds = dayTasks.map((dayTask) => dayTask.id);

      if (dayTaskIds.length > 0) {
        await this.dayTaskRepository.delete(dayTaskIds);
      }
    } catch (error) {
      throw new Error('Failed to delete day tasks');
    }
  }

  async deleteDays(days: Day[]): Promise<void> {
    try {
      await this.deleteDayTasks(days.map((day) => day.dayTasks).flat());
      const dayIds = days.map((day) => day.id);

      if (dayIds.length > 0) {
        await this.dayRepository.delete(dayIds);
      }
    } catch (error) {
      throw new Error('Failed to delete days');
    }
  }
}
