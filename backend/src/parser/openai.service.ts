import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI;

  private readonly instructions = `Tu tarea es parsear el siguiente CV y devolverlo en un JSON válido con la siguiente estructura (no inventes datos si no existen):

\`\`\`json
{
  "bio": {
    "nombres": "",
    "apellidos": "",
    "rut":"",
    "ubicacion":"",
    "mail": "",
    "numero": "",
    "profesion": "",
    "resumen": ""
  },
  "experiencias": [
    {
      "puesto": "",
      "empresa": "",
      "inicio": "",
      "termino": "",
      "descripcion": ""
    }
  ],
  "formacion": [
    {
      "titulo": "",
      "institucion": "",
      "anio": ""
    }
  ],
  "stack_tecnologico": [],
  "idiomas": {}
}
\`\`\`

### Instrucciones:
1. **bio** → datos personales básicos del candidato.
   - "nombres" y "apellidos" deben separarse si aparecen juntos.
   - "rut" es el número de identificación de cédula chilena o pasaporte.
   - "ubicacion" corresponde solo a la comuna de vivienda.
   - "mail" y "numero" deben incluir solo un correo y un teléfono.
   - "profesion" es el título o área principal.
   - "resumen" debe ser un párrafo breve con el perfil profesional. Este es el único elemento que debes generar en caso de que no exista. Utiliza un formato en el que se empiece mencionando la profesión y experiencia del candidato procedas con sus principales experiencias mencionando sus principales tecnologías en negrita (formato html <strong></strong>)

2. **experiencias** → cada experiencia laboral es un objeto dentro del array. Asegurate de ordenarlas posteriormente por fecha de la más reciente a la más antigua
   - "puesto": cargo principal.
   - "empresa": nombre de la empresa y, si corresponde, el cliente/proyecto entre paréntesis.
   - "inicio" y "termino": fechas en formato "Mes Año" o solo año si no hay detalle. Si es actual, poner "a la fecha".
   - "descripcion": incluir toda la descripción de tareas, responsabilidades y tecnologías.
   - Si hay más de un párrafo en la descripción, usar "<br>" como separador. Si la descripción tiene punteo o negrita mantenerlas en formato html.

3. **formacion** → estudios académicos.
   - "titulo": nombre del programa o carrera.
   - "institucion": universidad, instituto o centro.
   - "anio": rango de años o solo año si está disponible.

4. **stack_tecnologico** → lista de tecnologías, lenguajes, frameworks, bases de datos, herramientas y metodologías.
   - Solo nombres de tecnologías, sin duplicados si es posible.

5. **idiomas** → lista de idiomas en formato diccionario "idioma" : "nivel". Los niveles son "Básico", "Intermedio", "Avanzado", "Nativo" y "Técnico". Si su respuesta no corresponde adáptalo a este sistema. Siempre incluye los idiomas "Español" e "Inglés". Si la nacionalidad del candidato no lo contradice puedes asumir Español Nativo. Si el candidato no menciona nivel de ingles puedes dejar la cadena vacía \`""\`.

6. Si un campo no tiene información disponible, dejarlo como cadena vacía \`""\`.

7. El resultado debe ser **únicamente JSON válido**, sin explicaciones adicionales.`;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async extractCV(pdfPath: string): Promise<any> {
    this.logger.log(`Uploading file to OpenAI: ${pdfPath}`);
    
    const file = await this.client.files.create({
      file: fs.createReadStream(pdfPath),
      purpose: 'user_data' as any,
    });

    this.logger.log(`File uploaded with ID: ${file.id}`);

    const response = await (this.client as any).responses.create({
      model: 'gpt-4.1-mini',
      instructions: this.instructions,
      input: [{
        role: 'user',
        content: [{
          type: 'input_file',
          file_id: file.id,
        }],
      }],
      store: true,
    });

    this.logger.log('OpenAI response received, parsing JSON...');

    let jsonStr = response.output_text;
    
    // Strip markdown code fences if present
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    const parsed = JSON.parse(jsonStr);

    // Cleanup: delete the file from OpenAI
    try {
      await (this.client.files as any).del(file.id).catch(() => this.client.files.delete(file.id));
      this.logger.log(`Deleted file ${file.id} from OpenAI`);
    } catch (e) {
      this.logger.warn(`Failed to delete file ${file.id} from OpenAI: ${e}`);
    }

    return parsed;
  }
}
