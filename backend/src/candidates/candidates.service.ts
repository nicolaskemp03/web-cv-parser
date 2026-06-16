import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../entities/candidate.entity';
import { Experience } from '../entities/experience.entity';
import { Education } from '../entities/education.entity';
import { Template } from '../entities/template.entity';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
    @InjectRepository(Experience)
    private experienceRepo: Repository<Experience>,
    @InjectRepository(Education)
    private educationRepo: Repository<Education>,
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
  ) {}

  async createFromParsed(data: any, userId?: string): Promise<Candidate> {
    const bio = data.bio || {};

    // Get default template
    const defaultTemplate = await this.templateRepo.findOne({ where: { is_default: true } });

    const candidate = this.candidateRepo.create({
      nombres: bio.nombres || '',
      apellidos: bio.apellidos || '',
      rut: bio.rut || null,
      ubicacion: bio.ubicacion || null,
      mail: bio.mail || null,
      numero: bio.numero || null,
      profesion: bio.profesion || null,
      resumen: bio.resumen || null,
      stack: data.stack_tecnologico || [],
      idiomas: data.idiomas || {},
      raw_json: data,
      template: defaultTemplate || undefined,
      createdBy: userId ? { id: userId } as any : undefined,
    });

    const savedCandidate = await this.candidateRepo.save(candidate);

    // Save experiences
    if (data.experiencias && Array.isArray(data.experiencias)) {
      const experiences = data.experiencias.map((exp: any, index: number) =>
        this.experienceRepo.create({
          candidate: savedCandidate,
          puesto: exp.puesto || null,
          empresa: exp.empresa || null,
          inicio: exp.inicio || null,
          termino: exp.termino || null,
          descripcion: exp.descripcion || null,
          orden: index,
        }),
      );
      await this.experienceRepo.save(experiences);
    }

    // Save education
    if (data.formacion && Array.isArray(data.formacion)) {
      const education = data.formacion.map((edu: any, index: number) =>
        this.educationRepo.create({
          candidate: savedCandidate,
          titulo: edu.titulo || null,
          institucion: edu.institucion || null,
          anio: edu.anio || null,
          orden: index,
        }),
      );
      await this.educationRepo.save(education);
    }

    // Return with relations loaded
    return this.findOne(savedCandidate.id);
  }

  async findAll(): Promise<Candidate[]> {
    return this.candidateRepo.find({
      relations: { experiences: true, education: true, template: true, createdBy: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({
      where: { id },
      relations: { experiences: true, education: true, template: true, createdBy: true },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate ${id} not found`);
    }
    return candidate;
  }

  async update(id: string, updateData: Partial<any>): Promise<Candidate> {
    const candidate = await this.findOne(id);

    // Update basic fields
    if (updateData.bio) {
      const bio = updateData.bio;
      candidate.nombres = bio.nombres ?? candidate.nombres;
      candidate.apellidos = bio.apellidos ?? candidate.apellidos;
      candidate.rut = bio.rut ?? candidate.rut;
      candidate.ubicacion = bio.ubicacion ?? candidate.ubicacion;
      candidate.mail = bio.mail ?? candidate.mail;
      candidate.numero = bio.numero ?? candidate.numero;
      candidate.profesion = bio.profesion ?? candidate.profesion;
      candidate.resumen = bio.resumen ?? candidate.resumen;
    }

    if (updateData.stack_tecnologico) {
      candidate.stack = updateData.stack_tecnologico;
    }

    if (updateData.idiomas) {
      candidate.idiomas = updateData.idiomas;
    }

    await this.candidateRepo.save(candidate);

    // Replace experiences if provided
    if (updateData.experiencias && Array.isArray(updateData.experiencias)) {
      await this.experienceRepo.delete({ candidate: { id } });
      const experiences = updateData.experiencias.map((exp: any, index: number) =>
        this.experienceRepo.create({
          candidate: { id } as any,
          puesto: exp.puesto || null,
          empresa: exp.empresa || null,
          inicio: exp.inicio || null,
          termino: exp.termino || null,
          descripcion: exp.descripcion || null,
          orden: index,
        }),
      );
      await this.experienceRepo.save(experiences);
    }

    // Replace education if provided
    if (updateData.formacion && Array.isArray(updateData.formacion)) {
      await this.educationRepo.delete({ candidate: { id } });
      const education = updateData.formacion.map((edu: any, index: number) =>
        this.educationRepo.create({
          candidate: { id } as any,
          titulo: edu.titulo || null,
          institucion: edu.institucion || null,
          anio: edu.anio || null,
          orden: index,
        }),
      );
      await this.educationRepo.save(education);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const candidate = await this.findOne(id);
    await this.candidateRepo.remove(candidate);
  }
}
