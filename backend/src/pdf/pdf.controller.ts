import { Controller, Post, Param, Res, UseGuards, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/candidates')
export class PdfController {
  private readonly logger = new Logger(PdfController.name);

  constructor(private pdfService: PdfService) {}

  @Post(':id/download-pdf')
  @UseGuards(JwtAuthGuard)
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      this.logger.log(`[PDF] Request received to generate PDF for candidate ${id}`);
      
      const { buffer, filename } = await this.pdfService.generatePdf(id);
      this.logger.log(`[PDF] PDF successfully generated for ${id}. Buffer size: ${buffer.length} bytes`);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
      this.logger.log(`[PDF] Response fully sent for candidate ${id}`);
    } catch (error) {
      this.logger.error(`[PDF] Error in downloadPdf controller: ${error.message}`, error.stack);
      // Fallback response so frontend gets a proper 500 error instead of hanging
      if (!res.headersSent) {
        res.status(500).json({ statusCode: 500, message: 'Internal server error while generating PDF' });
      }
    }
  }
}
