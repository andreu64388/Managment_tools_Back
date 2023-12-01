import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Day } from './day.entity';
import { Task } from '../../task/entities/task.entity';

@Entity('dayTask')
export class DayTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Day, (day) => day.dayTasks, {
    onDelete: 'CASCADE',
  })
  day: Day;

  @ManyToOne(() => Task, (task) => task.dayTasks, {
    onDelete: 'CASCADE',
  })
  task: Task;
}
