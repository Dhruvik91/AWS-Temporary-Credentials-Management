import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { Credential } from './credential.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  role: string;

  @OneToMany(() => Credential, credential => credential.user)
  credentials: Credential[];

  @OneToMany(() => AuditLog, auditLog => auditLog.user)
  auditLogs: AuditLog[];
}