import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ConverterService } from './converter.service';
import { CandidatesService } from '../candidates/candidates.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private openAIService: OpenAIService,
    private converterService: ConverterService,
    private candidatesService: CandidatesService,
  ) {}

  async parseSingle(file: Express.Multer.File, userId?: string): Promise<any> {
    let pdfPath = file.path;
    let convertedPdf: string | null = null;

    try {
      // Step 1: Convert DOCX to PDF if necessary
      if (file.originalname.toLowerCase().endsWith('.docx')) {
        this.logger.log('DOCX detected, converting to PDF...');
        convertedPdf = await this.converterService.docxToPdf(file.path);
        pdfPath = convertedPdf;
      }

      // Step 2: Extract structured data via OpenAI
      this.logger.log('Sending PDF to OpenAI for extraction...');
      const extractedData = await this.openAIService.extractCV(pdfPath);

      // Step 3: Persist to database
      this.logger.log('Persisting candidate to database...');
      const candidate = await this.candidatesService.createFromParsed(extractedData, userId);

      return candidate;
    } finally {
      // Cleanup temporary files
      this.cleanupFile(file.path);
      if (convertedPdf && convertedPdf !== file.path) {
        this.cleanupFile(convertedPdf);
      }
    }
  }

  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch (e) {
      this.logger.warn(`Failed to cleanup temp file ${filePath}: ${e}`);
    }
  }
}
