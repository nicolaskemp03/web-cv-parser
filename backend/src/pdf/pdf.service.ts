import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';
import { Candidate } from '../entities/candidate.entity';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

// Raw Konexa SVG logo for crisp rendering in Puppeteer
const KONEXA_LOGO_SVG = `
<svg class="logo" viewBox="0 0 1441 1440" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2; width: 100%; height: auto; max-height: 125px;">
    <g transform="matrix(1,0,0,1,-7960,0)">
        <g transform="matrix(0.5625,0,0,1,4977.96,0)">
            <g transform="matrix(4.28492,0,0,2.41027,4292.31,-501.118)">
                <path d="M335.333,761.719L254.227,761.719L432.342,240.762L512.388,240.762L335.333,761.719Z" style="fill:rgb(71,255,150);fill-rule:nonzero;"/>
                <g transform="matrix(1.22083,0,0,1.16502,-129.45,-83.1473)">
                    <path d="M526.599,470.886L753.586,370.463L773.048,429.245L599.342,501.308L773.417,575.588L753.586,632.018L526.599,531.594L526.599,470.886Z" style="fill:rgb(71,255,150);fill-rule:nonzero;"/>
                </g>
            </g>
        </g>
    </g>
</svg>
`;

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
      logo_svg: KONEXA_LOGO_SVG,
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
    hbs = hbs.replace(/<img[^>]*src="data:image\/png;base64,\{\{\s*logo_base64\s*\}\}"[^>]*>/g, '{{{logo_svg}}}');

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
