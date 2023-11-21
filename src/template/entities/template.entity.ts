import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Task } from '../task/entities/task.entity';
import { Plan } from '../plan/entities/plan.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int', nullable: true })
  prepTime: number;

  @Column({ type: 'int', nullable: true })
  idealPreReq: number;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @OneToMany(() => Task, (task) => task.template, {
    onDelete: 'CASCADE',
  })
  tasks: Task[];

  @OneToMany(() => Plan, (plan) => plan.template, { onDelete: 'CASCADE' })
  plans: Plan[];
}
