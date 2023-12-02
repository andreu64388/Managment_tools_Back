import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Role } from 'src/role/entities/role.entity';
import { Plan } from 'src/template/plan/entities/plan.entity';
import { UserTaskStatus } from 'src/template/task/entities/UserTaskStatus.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string | null;

  @Column({ nullable: true })
  kindAuth: string;

  @CreateDateColumn({ type: 'timestamp' })
  createAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updateAt: Date;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];

  @OneToMany(() => Plan, (plan) => plan.user)
  plans: Plan[];

  @OneToMany(() => UserTaskStatus, (userTaskStatus) => userTaskStatus.user)
  taskStatuses: UserTaskStatus[];
}
