import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Template } from 'src/template/entities/template.entity';
import { UserTaskStatus } from './UserTaskStatus.entity';
import { DayTask } from 'src/template/plan/entities/dayTask';
import { Video } from './video.entity';
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

  @OneToMany(() => DayTask, (dayTask) => dayTask.task, {
    cascade: true,
  })
  dayTasks: DayTask[];

  @ManyToOne(() => Template, (template) => template.tasks)
  template: Template;

  @OneToMany(() => UserTaskStatus, (userTaskStatus) => userTaskStatus.task, {
    onDelete: 'CASCADE',
  })
  userTaskStatuses: UserTaskStatus[];

  @OneToMany(() => Video, (video) => video.task, {
    cascade: true,
  })
  video: Video[];
}
