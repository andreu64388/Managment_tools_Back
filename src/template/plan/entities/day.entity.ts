import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from '../../task/entities/task.entity';
import { Week } from './week.entity';

@Entity('days')
export class Day {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dayNumber: Date;

  @ManyToOne(() => Task, (task) => task.days, { nullable: true })
  task: Task;

  @ManyToOne(() => Week, (week) => week.days)
  week: Week;
}
