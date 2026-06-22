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

  // Limpiador para convertir el HTML de ReactQuill al formato que espera la plantilla PDF
  private cleanQuillHtml(html: string): string {
    if (!html) return html;
    return html
      .replace(/<\/p>\s*<p>/gi, '<br><br>') // Convertir saltos de párrafo en <br>
      .replace(/<\/?p[^>]*>/gi, '')         // Eliminar etiquetas <p> restantes
      .replace(/class="[^"]*"/gi, '')       // Eliminar clases inyectadas por Quill (ej. ql-align-justify)
      .trim();
  }

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
    this.logger.log(`Updating candidate ${id} with data keys: ${Object.keys(updateData).join(', ')}`);

    // El frontend envía la estructura aplanada de la entidad
    candidate.nombres = updateData.nombres ?? candidate.nombres;
    candidate.apellidos = updateData.apellidos ?? candidate.apellidos;
    candidate.rut = updateData.rut ?? candidate.rut;
    candidate.ubicacion = updateData.ubicacion ?? candidate.ubicacion;
    candidate.mail = updateData.mail ?? candidate.mail;
    candidate.numero = updateData.numero ?? candidate.numero;
    candidate.profesion = updateData.profesion ?? candidate.profesion;
    candidate.resumen = updateData.resumen ? this.cleanQuillHtml(updateData.resumen) : candidate.resumen;

    if (updateData.stack) {
      candidate.stack = updateData.stack;
    }

    if (updateData.idiomas) {
      candidate.idiomas = updateData.idiomas;
    }

    await this.candidateRepo.save(candidate);

    // Reemplazar experiencias si vienen en el payload (flattened key 'experiences')
    if (updateData.experiences && Array.isArray(updateData.experiences)) {
      await this.experienceRepo.delete({ candidate: { id } });
      const experiences = updateData.experiences.map((exp: any, index: number) =>
        this.experienceRepo.create({
          candidate: { id } as any,
          puesto: exp.puesto || undefined,
          empresa: exp.empresa || undefined,
          inicio: exp.inicio || undefined,
          termino: exp.termino || undefined,
          descripcion: exp.descripcion ? this.cleanQuillHtml(exp.descripcion) : undefined,
          orden: index,
        }),
      );
      await this.experienceRepo.save(experiences);
    }

    // Reemplazar educación si viene en el payload (flattened key 'education')
    if (updateData.education && Array.isArray(updateData.education)) {
      await this.educationRepo.delete({ candidate: { id } });
      const education = updateData.education.map((edu: any, index: number) =>
        this.educationRepo.create({
          candidate: { id } as any,
          titulo: edu.titulo || undefined,
          institucion: edu.institucion || undefined,
          anio: edu.anio || undefined,
          orden: index,
        }),
      );
      await this.educationRepo.save(education);
    }

    this.logger.log(`Candidate ${id} updated successfully`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const candidate = await this.findOne(id);
    await this.candidateRepo.remove(candidate);
  }
}
