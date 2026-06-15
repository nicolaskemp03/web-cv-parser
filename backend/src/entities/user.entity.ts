import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text')
  name: string;

  @Column('text', { unique: true, nullable: true })
  ms_object_id: string;

  @Column('text', { default: 'recruiter' })
  role: string;

  @Column('text', { nullable: true })
  avatar_url: string;

  @Column('timestamptz', { nullable: true })
  last_login: Date;

  @CreateDateColumn()
  created_at: Date;
}
