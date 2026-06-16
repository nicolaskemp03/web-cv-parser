import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execFileAsync = promisify(execFile);

@Injectable()
export class ConverterService {
  private readonly logger = new Logger(ConverterService.name);

  /**
   * Converts a DOCX file to PDF using LibreOffice CLI.
   * Returns the path to the generated PDF.
   */
  async docxToPdf(docxPath: string): Promise<string> {
    const outputDir = path.dirname(docxPath);
    const baseName = path.basename(docxPath, '.docx');
    const expectedPdfPath = path.join(outputDir, `${baseName}.pdf`);

    this.logger.log(`Converting DOCX to PDF: ${docxPath}`);

    try {
      await execFileAsync('libreoffice', [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', outputDir,
        docxPath,
      ], { timeout: 30000 });
    } catch (error: any) {
      this.logger.error(`LibreOffice conversion failed: ${error.message}`);
      throw new Error(`Failed to convert DOCX to PDF: ${error.message}`);
    }

    if (!fs.existsSync(expectedPdfPath)) {
      throw new Error(`PDF was not generated at expected path: ${expectedPdfPath}`);
    }

    this.logger.log(`PDF generated: ${expectedPdfPath}`);
    return expectedPdfPath;
  }
}
