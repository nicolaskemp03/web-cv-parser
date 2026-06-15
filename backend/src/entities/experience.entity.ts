import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from './candidate.entity';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Candidate, candidate => candidate.experiences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column('text', { nullable: true })
  puesto: string;

  @Column('text', { nullable: true })
  empresa: string;

  @Column('text', { nullable: true })
  inicio: string;

  @Column('text', { nullable: true })
  termino: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('int', { default: 0 })
  orden: number;
}
