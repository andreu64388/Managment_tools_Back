import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Day } from './day.entity';
import { Plan } from './plan.entity';

@Entity('weeks')
export class Week {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Day, (day) => day.week, { cascade: true })
  days: Day[];

  @ManyToOne(() => Plan, (plan) => plan.weeks)
  plan: Plan;
}
