import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Day } from '../../plan/entities/day.entity';
import { Template } from 'src/template/entities/template.entity';
import { UserTaskStatus } from './UserTaskStatus.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  duration: number;

  @CreateDateColumn({ type: 'timestamp' })
  createAt: Date;

  @Column('text', { nullable: true })
  descriptions: string;

  @OneToMany(() => Day, (day) => day.task, { onDelete: 'CASCADE' })
  days: Day[];

  @ManyToOne(() => Template, (template) => template.tasks)
  template: Template;

  @OneToMany(() => UserTaskStatus, (userTaskStatus) => userTaskStatus.task, {
    onDelete: 'CASCADE',
  })
  userTaskStatuses: UserTaskStatus[];
}
