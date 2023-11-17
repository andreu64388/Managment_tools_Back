import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Day } from '../entities/day.entity';
import { Task } from 'src/template/task/entities/task.entity';
import { addDays } from 'date-fns';

@Injectable()
export class DayService {
  constructor(
    @InjectRepository(Day)
    private readonly dayRepository: Repository<Day>,
  ) {}

  async generateDays(
    tasks: Task[],
    startDate: Date,
    totalDays: number,
  ): Promise<Day[]> {
    const days: Day[] = [];
    let taskIndex = 0;

    for (let i = 0; i < totalDays; i++) {
      const currentDay = addDays(startDate, i);

      let selectedTask = null;
      if (taskIndex < tasks.length) {
        selectedTask = tasks[taskIndex];
        taskIndex++;
      }

      if (selectedTask !== null) {
        const day = this.dayRepository.create({
          dayNumber: currentDay,
          task: selectedTask,
        });
        const savedDay = await this.dayRepository.save(day);
        days.push(savedDay);
      }
    }

    return days;
  }

  async deleteDays(days: Day[]): Promise<void> {
    await this.dayRepository.remove(days);
  }
}
