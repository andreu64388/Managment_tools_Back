import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Week } from './week.entity';
import { DayTask } from './dayTask';

@Entity('days')
export class Day {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dayNumber: Date;

  @OneToMany(() => DayTask, (dayTask) => dayTask.day, {
    cascade: true,
  })
  dayTasks: DayTask[];

  @ManyToOne(() => Week, (week) => week.days)
  week: Week;
}
