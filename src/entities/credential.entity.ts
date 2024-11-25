import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accessKeyId: string;

  @Column()
  secretAccessKey: string;

  @Column({ nullable: true })
  consoleUsername: string;

  @Column({ nullable: true })
  consolePassword: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => User, user => user.credentials)
  user: User;
}