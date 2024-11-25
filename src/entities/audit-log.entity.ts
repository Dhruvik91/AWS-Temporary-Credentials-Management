import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column()
  resourceType: string;

  @Column()
  resourceId: string;

  @Column('jsonb', { nullable: true })
  details: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, user => user.auditLogs)
  user: User;
}