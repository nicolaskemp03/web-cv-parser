import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from './candidate.entity';

@Entity('education')
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Candidate, candidate => candidate.education, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column('text', { nullable: true })
  titulo: string;

  @Column('text', { nullable: true })
  institucion: string;

  @Column('text', { nullable: true })
  anio: string;

  @Column('int', { default: 0 })
  orden: number;
}
