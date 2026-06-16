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
  private readonly baseUrl = 'https://api.na.teamtailor.com/v1';
  private cachedCandidates: any[] | null = null;
  private cacheTimestamp: number = 0;

  constructor(
    private configService: ConfigService,
    private parserService: ParserService,
  ) {
    this.apiKey = this.configService.get<string>('TEAMTAILOR_API_TOKEN') || '';
  }

  private get headers() {
    let authHeader = this.apiKey.trim();
    if (authHeader.startsWith('Bearer ')) {
      authHeader = `Token token=${authHeader.substring(7)}`;
    } else if (!authHeader.startsWith('Token token=')) {
      authHeader = `Token token=${authHeader}`;
    }

    return {
      Authorization: authHeader,
      'X-Api-Version': '20240404',
      Accept: 'application/vnd.api+json',
    };
  }

  async searchCandidates(query: string) {
    if (!query) return [];

    const cleanQuery = query.trim();

    // 1. Si la query es exactamente numérica, buscamos por ID
    if (/^\d+$/.test(cleanQuery)) {
      try {
        const res = await axios.get(`${this.baseUrl}/candidates/${cleanQuery}`, { headers: this.headers });
        return [res.data.data];
      } catch (e: any) {
        if (e.response?.status === 404) return [];
        throw e;
      }
    }

    // 2. Si la query contiene '@', buscamos por Email (Filtro oficial)
    if (cleanQuery.includes('@')) {
      const res = await axios.get(`${this.baseUrl}/candidates?filter[email]=${encodeURIComponent(cleanQuery)}&page[size]=10`, { headers: this.headers });
      return res.data.data;
    }

    // 3. Si la query parece un teléfono (+ seguido de números o mínimo 6 números)
    if (/^[+\d\s]+$/.test(cleanQuery) && cleanQuery.replace(/\s+/g, '').length >= 6) {
      const phone = encodeURIComponent(cleanQuery.replace(/\s+/g, ''));
      const res = await axios.get(`${this.baseUrl}/candidates?filter[phone]=${phone}&page[size]=10`, { headers: this.headers });
      return res.data.data;
    }

    // 4. "Out of the box": Filtro de Nombre en Memoria con Caché (1 minuto)
    // Teamtailor max page size is 30. We fetch 7 pages (210 candidates) in parallel.
    const now = Date.now();
    if (!this.cachedCandidates || (now - this.cacheTimestamp > 60000)) {
      this.logger.log('Fetching latest ~210 candidates for in-memory name search cache...');
      
      const pageRequests = Array.from({ length: 7 }, (_, i) => 
        axios.get(`${this.baseUrl}/candidates?page[size]=30&page[number]=${i + 1}&sort=-created-at`, { headers: this.headers })
      );

      const responses = await Promise.allSettled(pageRequests);
      let allCandidates: any[] = [];
      
      for (const res of responses) {
        if (res.status === 'fulfilled') {
          allCandidates = allCandidates.concat(res.value.data.data || []);
        } else {
          this.logger.warn(`TT Pagination request failed: ${res.reason.message}`);
        }
      }

      this.cachedCandidates = allCandidates;
      this.cacheTimestamp = now;
    }

    const lowerQuery = cleanQuery.toLowerCase();
    return this.cachedCandidates!.filter((c: any) => {
      const first = (c.attributes['first-name'] || '').toLowerCase();
      const last = (c.attributes['last-name'] || '').toLowerCase();
      const full = `${first} ${last}`;
      return full.includes(lowerQuery) || first.includes(lowerQuery) || last.includes(lowerQuery);
    });
  }

  async importCandidate(id: string, userId?: string) {
    this.logger.log(`Fetching candidate ${id} from Teamtailor...`);
    const url = `${this.baseUrl}/candidates/${id}`;
    
    let response;
    try {
      response = await axios.get(url, { headers: this.headers });
    } catch (e: any) {
      this.logger.error(`Error fetching from TT: ${e.message}`);
      throw new BadRequestException('No se pudo obtener el candidato desde Teamtailor');
    }

    const candidateData = response.data.data;
    const attributes = candidateData.attributes;
    
    const fileUrl = attributes.resume || attributes['original-resume'];

    if (!fileUrl) {
      throw new NotFoundException('El candidato no tiene un CV adjunto (resume) en Teamtailor.');
    }

    // Attempt to extract filename from URL, fallback to default
    let fileName = fileUrl.split('/').pop()?.split('?')[0] || `cv_${id}.pdf`;
    if (!fileName.toLowerCase().endsWith('.pdf') && !fileName.toLowerCase().endsWith('.docx')) {
      fileName += '.pdf'; // Asume PDF by default if no extension is clearly found in the URL
    }

    this.logger.log(`Downloading CV from Teamtailor: ${fileUrl}`);

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
