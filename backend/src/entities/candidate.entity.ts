import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Experience } from './experience.entity';
import { Education } from './education.entity';
import { Template } from './template.entity';
import { User } from './user.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  nombres: string;

  @Column('text')
  apellidos: string;

  @Column('text', { nullable: true })
  rut: string;

  @Column('text', { nullable: true })
  ubicacion: string;

  @Column('text', { nullable: true })
  mail: string;

  @Column('text', { nullable: true })
  numero: string;

  @Column('text', { nullable: true })
  profesion: string;

  @Column('text', { nullable: true })
  resumen: string;

  @Column('text', { array: true, default: '{}' })
  stack: string[];

  @Column('jsonb', { default: {} })
  idiomas: Record<string, string>;

  @Column('jsonb', { default: {} })
  raw_json: any;

  @ManyToOne(() => Template, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column('text', { nullable: true })
  tt_candidate_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => Experience, exp => exp.candidate, { cascade: true })
  experiences: Experience[];

  @OneToMany(() => Education, edu => edu.candidate, { cascade: true })
  education: Education[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
