import { Controller, Post, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/candidates')
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Post(':id/download-pdf')
  @UseGuards(JwtAuthGuard)
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.pdfService.generatePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
