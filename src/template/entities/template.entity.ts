import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Task } from '../task/entities/task.entity';
import { Plan } from '../plan/entities/plan.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int', nullable: true })
  prepTime: number;

  @Column({ nullable: true })
  idealPreReq: string;

  @OneToMany(() => Task, (task) => task.template, {
    onDelete: 'CASCADE',
  })
  tasks: Task[];

  @OneToMany(() => Plan, (plan) => plan.template, { onDelete: 'CASCADE' })
  plans: Plan[];

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createAt: Date;
}
