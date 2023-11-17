import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Week } from './week.entity';
import { UserTaskStatus } from 'src/template/task/entities/UserTaskStatus.entity';
import { Template } from 'src/template/entities/template.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deadline: Date;

  @Column({ nullable: true })
  startDate: Date;

  @OneToMany(() => Week, (week) => week.plan, { cascade: true })
  weeks: Week[];

  @ManyToOne(() => User, (user) => user.plans, { cascade: true })
  user: User;

  @ManyToOne(() => Template, (template) => template.plans, { cascade: true })
  template: Template;

  @OneToMany(() => UserTaskStatus, (userTaskStatus) => userTaskStatus.plan)
  userTaskStatuses: UserTaskStatus[];
}