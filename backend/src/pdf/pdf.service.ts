import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';
import { Candidate } from '../entities/candidate.entity';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

// Konexa SVG logo encoded as base64 (same as used in the Python parser)
const KONEXA_LOGO_BASE64 = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDE0NDEgMTQ0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij4KICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDEsMCwwLDEsLTc5NjAsMCkiPgogICAgICAgIDxnIGlkPSJMb2dvLUZhdmljb24tcG5nIiBzZXJpZjppZD0iTG9nbyBGYXZpY29uIHBuZyIgdHJhbnNmb3JtPSJtYXRyaXgoMC41NjI1LDAsMCwxLDQ5NzcuOTYsMCkiPgogICAgICAgICAgICA8cmVjdCB4PSI1MzAxLjgzIiB5PSIwIiB3aWR0aD0iMjU2MCIgaGVpZ2h0PSIxNDQwIiBzdHlsZT0iZmlsbDpub25lOyIvPgogICAgICAgICAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCg0LjI4NDkyLDAsMCwyLjQxMDI3LDQyOTIuMzEsLTUwMS4xMTgpIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0zMzUuMzMzLDc2MS43MTlMMjU0LjIyNyw3NjEuNzE5TDQzMi4zNDIsMjQwLjc2Mkw1MTIuMzg4LDI0MC43NjJMMzM1LjMzMyw3NjEuNzE5WiIgc3R5bGU9ImZpbGw6cmdiKDcxLDI1NSwxNTApO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4yMjA4MywwLDAsMS4xNjUwMiwtMTI5LjQ1LC04My4xNDczKSI+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTUyNi41OTksNDcwLjg4Nkw3NTMuNTg2LDM3MC40NjNMNzczLjA0OCw0MjkuMjQ1TDU5OS4zNDIsNTAxLjMwOEw3NzMuNDE3LDU3NS41ODhMNzUzLjU4Niw2MzIuMDE4TDUyNi41OTksNTMxLjU5NEw1MjYuNTk5LDQ3MC44ODZaIiBzdHlsZT0iZmlsbDpyZ2IoNzEsMjU1LDE1MCk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPgo=';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
  ) {}

  /**
   * Generates a PDF for a candidate, streaming it directly without saving to disk.
   * Replicates the exact same output as the Python WeasyPrint generator.
   */
  async generatePdf(candidateId: string): Promise<{ buffer: Buffer; filename: string }> {
    // Load candidate with relations
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: { experiences: true, education: true, template: true },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found`);
    }

    // Get template HTML (use candidate's template or default)
    let templateHtml: string;
    if (candidate.template?.html_content) {
      templateHtml = candidate.template.html_content;
    } else {
      const defaultTemplate = await this.templateRepo.findOne({ where: { is_default: true } });
      if (!defaultTemplate) {
        throw new NotFoundException('No default template found. Run the seed script first.');
      }
      templateHtml = defaultTemplate.html_content;
    }

    // Convert Jinja2-style template to Handlebars
    const hbsTemplate = this.convertJinjaToHandlebars(templateHtml);

    // Prepare template data (matching the Python parser's variable names)
    const templateData = {
      bio: {
        nombres: candidate.nombres,
        apellidos: candidate.apellidos,
        rut: candidate.rut,
        ubicacion: candidate.ubicacion,
        mail: candidate.mail,
        numero: candidate.numero,
        profesion: candidate.profesion,
        resumen: candidate.resumen,
      },
      experiencias: (candidate.experiences || [])
        .sort((a, b) => a.orden - b.orden)
        .map(exp => ({
          puesto: exp.puesto,
          empresa: exp.empresa,
          inicio: exp.inicio,
          termino: exp.termino,
          descripcion: exp.descripcion,
        })),
      formacion: (candidate.education || [])
        .sort((a, b) => a.orden - b.orden)
        .map(edu => ({
          titulo: edu.titulo,
          institucion: edu.institucion,
          anio: edu.anio,
        })),
      stack_tecnologico: candidate.stack || [],
      idiomas: candidate.idiomas || {},
      logo_base64: KONEXA_LOGO_BASE64,
    };

    // Register Handlebars helpers
    this.registerHelpers();

    // Compile and render
    const compiled = Handlebars.compile(hbsTemplate);
    const renderedHtml = compiled(templateData);

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(renderedHtml, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
        printBackground: true,
      });

      const filename = this.buildFilename(candidate.nombres, candidate.apellidos);

      return { buffer: Buffer.from(pdfBuffer), filename };
    } finally {
      await browser.close();
    }
  }

  /**
   * Converts Jinja2 template syntax to Handlebars syntax.
   * Handles the specific patterns used in the Hunting template.
   */
  private convertJinjaToHandlebars(jinja: string): string {
    let hbs = jinja;

    // Remove Jinja2 {% set %} blocks — we compute these in the data prep instead
    // Replace the hunting_name computation with Handlebars helper
    hbs = hbs.replace(/\{%\s*set\s+full_name\s*=.*?%\}/g, '');
    hbs = hbs.replace(/\{%\s*set\s+primer_nombre\s*=.*?%\}/g, '');
    hbs = hbs.replace(/\{%\s*set\s+inicial_apellido\s*=.*?%\}/g, '');
    hbs = hbs.replace(/\{%\s*set\s+hunting_name\s*=.*?%\}/g, '');

    // Replace {{ hunting_name }} with our helper
    hbs = hbs.replace(/\{\{\s*hunting_name\s*\}\}/g, '{{huntingName bio.nombres bio.apellidos}}');

    // Replace Jinja2 for loops for idiomas (dict iteration)
    // {% for idioma, nivel in idiomas.items() %} ... {% endfor %}
    hbs = hbs.replace(
      /\{%\s*for\s+idioma,\s*nivel\s+in\s+idiomas\.items\(\)\s*%\}/g,
      '{{#each idiomas}}'
    );

    // Replace Jinja2 for loops for stack
    // {% for tech in stack_tecnologico %} ... {% endfor %}
    hbs = hbs.replace(
      /\{%\s*for\s+tech\s+in\s+stack_tecnologico\s*%\}/g,
      '{{#each stack_tecnologico}}'
    );

    // Replace Jinja2 for loops for experiencias
    hbs = hbs.replace(
      /\{%\s*for\s+job\s+in\s+experiencias\s*%\}/g,
      '{{#each experiencias}}'
    );

    // Replace Jinja2 for loops for formacion
    hbs = hbs.replace(
      /\{%\s*for\s+edu\s+in\s+formacion\s*%\}/g,
      '{{#each formacion}}'
    );

    // Replace {% endfor %} with {{/each}}
    hbs = hbs.replace(/\{%\s*endfor\s*%\}/g, '{{/each}}');

    // Inside idiomas loop: {{ idioma }} → {{@key}}, {{ nivel }} → {{this}}
    hbs = hbs.replace(/\{\{\s*idioma\s*\}\}/g, '{{@key}}');
    hbs = hbs.replace(/\{\{\s*nivel\s*\}\}/g, '{{this}}');

    // Inside stack loop: {{ tech }} → {{this}}
    hbs = hbs.replace(/\{\{\s*tech\s*\}\}/g, '{{this}}');

    // Inside experiencias loop: {{job.X}} → {{this.X}}
    hbs = hbs.replace(/\{\{job\./g, '{{this.');

    // Inside formacion loop: {{edu.X}} → {{this.X}}
    hbs = hbs.replace(/\{\{edu\./g, '{{this.');

    // Standard Jinja2 {{ var }} → already valid Handlebars (double curly)
    // But we need triple-stache for HTML content (resumen has <strong> tags)
    hbs = hbs.replace(/\{\{\s*bio\.resumen\s*\}\}/g, '{{{bio.resumen}}}');
    hbs = hbs.replace(/\{\{\s*this\.descripcion\s*\}\}/g, '{{{this.descripcion}}}');

    return hbs;
  }

  private registerHelpers(): void {
    // huntingName: "Juan" "Pérez García" → "Juan P."
    if (!Handlebars.helpers['huntingName']) {
      Handlebars.registerHelper('huntingName', (nombres: string, apellidos: string) => {
        const primerNombre = (nombres || '').split(' ')[0] || '';
        const inicialApellido = (apellidos || '')[0] || '';
        return `${primerNombre} ${inicialApellido}.`;
      });
    }
  }

  /**
   * Builds a safe PDF filename with fallback for edge cases.
   * "José María" "García López" → "José_García_CV.pdf"
   */
  private buildFilename(nombres: string, apellidos: string): string {
    const primerNombre = (nombres || '').split(' ')[0] || '';
    const primerApellido = (apellidos || '').split(' ')[0] || '';

    if (!primerNombre && !primerApellido) {
      return 'Candidato_Konexa_CV.pdf';
    }

    const parts = [primerNombre, primerApellido].filter(Boolean);
    return `${parts.join('_')}_CV.pdf`;
  }
}
