import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from '../entities/template.entity';
import { Candidate } from '../entities/candidate.entity';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template, Candidate]),
  ],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
