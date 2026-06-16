import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class TeamtailorService {
  private readonly logger = new Logger(TeamtailorService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.teamtailor.com/v1';

  constructor(
    private configService: ConfigService,
    private parserService: ParserService,
  ) {
    this.apiKey = this.configService.get<string>('TEAMTAILOR_API_TOKEN') || '';
  }

  private get headers() {
    return {
      Authorization: this.apiKey,
      'X-Api-Version': '20210218',
      Accept: 'application/vnd.api+json',
    };
  }

  async searchCandidates(query: string) {
    if (!query) return [];

    let url = `${this.baseUrl}/candidates?page[size]=10`;
    
    // Si la query parece un número (ID de teamtailor) o si contiene texto
    if (/^\d+$/.test(query)) {
      try {
        const res = await axios.get(`${this.baseUrl}/candidates/${query}`, { headers: this.headers });
        return [res.data.data];
      } catch (e) {
        if (e.response?.status === 404) return [];
        throw e;
      }
    } else {
      url += `&filter[name]=${encodeURIComponent(query)}`;
      const res = await axios.get(url, { headers: this.headers });
      return res.data.data;
    }
  }

  async importCandidate(id: string, userId?: string) {
    this.logger.log(`Fetching candidate ${id} from Teamtailor with documents...`);
    const url = `${this.baseUrl}/candidates/${id}?include=documents`;
    
    let response;
    try {
      response = await axios.get(url, { headers: this.headers });
    } catch (e) {
      this.logger.error(`Error fetching from TT: ${e.message}`);
      throw new BadRequestException('No se pudo obtener el candidato desde Teamtailor');
    }

    const data = response.data;
    const included = data.included || [];
    
    // Find a valid CV document (PDF or DOCX)
    const documents = included.filter((item: any) => item.type === 'documents');
    let targetDoc = null;

    for (const doc of documents) {
      const fileName = (doc.attributes['file-name'] || '').toLowerCase();
      if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
        targetDoc = doc;
        break;
      }
    }

    if (!targetDoc) {
      throw new NotFoundException('El candidato no tiene un CV en formato PDF o DOCX adjunto en Teamtailor.');
    }

    const fileUrl = targetDoc.attributes.url;
    const fileName = targetDoc.attributes['file-name'];
    this.logger.log(`Downloading CV from Teamtailor: ${fileName}`);

    // Download the file
    let fileBuffer;
    try {
      const fileRes = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      fileBuffer = Buffer.from(fileRes.data);
    } catch (e) {
      throw new BadRequestException('No se pudo descargar el documento desde Teamtailor.');
    }

    // Save temporarily to disk so ParserService can use it
    const ext = path.extname(fileName) || (fileName.toLowerCase().endsWith('pdf') ? '.pdf' : '.docx');
    const tempPath = path.join(os.tmpdir(), `${uuidv4()}${ext}`);
    fs.writeFileSync(tempPath, fileBuffer);

    const mockMulterFile = {
      path: tempPath,
      originalname: fileName,
      mimetype: fileName.toLowerCase().endsWith('pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    } as Express.Multer.File;

    // Send to ParserService
    this.logger.log(`Sending downloaded TT file to ParserService...`);
    const candidate = await this.parserService.parseSingle(mockMulterFile, userId);

    return candidate;
  }
}
