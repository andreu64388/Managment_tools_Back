import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from './task.entity';
import { Plan } from 'src/template/plan/entities/plan.entity';

@Entity('user_task_status')
export class UserTaskStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.taskStatuses, { cascade: true })
  user: User;

  @ManyToOne(() => Plan, (plan) => plan.userTaskStatuses, { cascade: true })
  plan: Plan;

  @ManyToOne(() => Task, (task) => task.userTaskStatuses, { cascade: true })
  task: Task;

  @Column({
    default: false,
  })
  completed: boolean;
}
