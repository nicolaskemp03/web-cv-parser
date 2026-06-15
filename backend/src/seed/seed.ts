import { DataSource } from 'typeorm';
import { Template } from '../entities/template.entity';
import { dataSourceOptions } from '../../data-source';

const huntingTemplateHTML = `<!DOCTYPE html>
<html lang="es">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap');

    @page { size: A4; margin: 18mm;}
    .header {
        margin: 0px; 
        display: grid; 
        grid-template-columns: 174px auto ; 
        gap: 0px; 
        background-color: #162b3b; 
        color: #f8fafa;
        align-items: center;
        height: 150px;
        
    }
    .logo { 
        width: 150px; 
        height: 125px; 
        display: flex; 
        justify-content: center;
        align-items: center;
        margin : 13px;
        
    }
    .logo img {
        width: 150px;
        height: auto;
        gap: 25px;
        color-interpolation-filters: sRGB;
        image-rendering: optimizeQuality;
        background-color: #162b3b; /* si lo aplanaste con ese color */
    }
    .title { 
        gap : 20px; 
        padding: 25px; 
        border-bottom: 3px solid #47ff96
    }
    
    .wrapper { 
        display: table;
        width: 100%;
        table-layout: fixed;
    }
    
    .sidebar {
        background-color: #162b3b;
        color: #f8fafa;
        padding: 12px;
        border-right: 3px solid #47ff96;
        display: table-cell;
        width: 150px;
        vertical-align: top;
    }
    
    .main {
        background-color: #f8fafa;
        padding: 20px;
        gap: 20px;
        display: table-cell;
        width: auto;
        
    }
    
    
    .preview {
        width: 210mm;     
        height: 297mm;    
        margin: 0px auto;
        background-color: #f8fafa;
        border: 1px solid #ccc;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        padding: 18mm;     
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    } 
    
    .tech-bubble {
        display: inline-block;
        background-color: #f8fafa;
        color: #162b3b;
        border-radius: 15px;
        border: 1px solid #47ff96;
        padding: 4px 8px;
        margin: 2px;
        font-size: 12px;
    }
    
    .main p, .main li p {
        text-align: justify;  /* justifica el texto */
        line-height: 1.4;    /* opcional: mejora lectura */
    }
    
    
    body { font-family: "Ubuntu", Open-Sans; font-size: 12px; color: #162b3b; margin: 0; }
    
    h2, h3 {
        page-break-after: avoid;
        page-break-inside: avoid;
    }
    
    /* Permite que listas largas sí se dividan */
    ul, p {
        page-break-inside: auto;
    }
    
    
</style>
<div class="review">
    {% set full_name = bio.nombres ~ '  ' ~ bio.apellidos %}
    {% set primer_nombre = bio.nombres.split(' ')[0] %}
    {% set inicial_apellido = bio.apellidos[0] %}
    {% set hunting_name = primer_nombre ~ ' ' ~ inicial_apellido ~ '.' %}
    <div class="header">
        <div class="logo">
            <img src="data:image/png;base64,{{ logo_base64 }}" alt="Logo" class="logo">
        </div>
        <div class="title">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <h1>{{ hunting_name }}</h1>
            </head>
            <h2 style="gap:10px">{{ bio.profesion }}</h2>
        </div>
    </div>
    
    <div class="wrapper">
        <aside class="sidebar"> 
            <h2>Idiomas</h2>
            <ul>
                {% for idioma, nivel in idiomas.items() %}
                <li><strong>{{ idioma }}</strong></li>
                <p>{{ nivel }} </p>
                {% endfor %}
            </ul>
            <h2>Stack</h2>
            <p>    {% for tech in stack_tecnologico %}
                <span class="tech-bubble">{{ tech }}</span>
                {% endfor %}
            </p>
        </aside>
        <main class ="main">
            <h2>Perfil Profesional</h2>
            <p>{{ bio.resumen }}</p>    
            <h2>Experiencia Laboral</h2>
            <ul>
                {% for job in experiencias %}
                <li>
                    <strong>{{job.puesto}}</strong> en {{job.empresa}} ({{job.inicio}} - {{job.termino}})
                    <p>{{job.descripcion}}</p>
                </li>
                {% endfor %}
            </ul>
            <h2>Educacion</h2>
            <ul>
                {% for edu in formacion %}
                <li>
                    <strong>{{edu.titulo}}</strong> en {{edu.institucion}} ({{edu.anio}})
                </li>
                {% endfor %}
            </ul>
        </main>
        
    </div>
    
</div>
</html>`;

async function bootstrap() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  console.log('Database connected.');

  const templateRepo = dataSource.getRepository(Template);
  
  let hunting = await templateRepo.findOne({ where: { name: 'Hunting' } });
  
  if (!hunting) {
    hunting = templateRepo.create({
      name: 'Hunting',
      html_content: huntingTemplateHTML,
      is_default: true,
    });
    await templateRepo.save(hunting);
    console.log('Hunting template seeded successfully.');
  } else {
    hunting.html_content = huntingTemplateHTML;
    hunting.is_default = true;
    await templateRepo.save(hunting);
    console.log('Hunting template updated successfully.');
  }

  await dataSource.destroy();
}

bootstrap().catch((err) => {
  console.error('Error seeding DB:', err);
  process.exit(1);
});
