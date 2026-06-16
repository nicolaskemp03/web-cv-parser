import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ParserService } from './parser.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as os from 'os';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Controller('api/parser')
export class ParserController {
  constructor(private parserService: ParserService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          cb(new BadRequestException(`Unsupported file type: ${file.mimetype}. Only PDF and DOCX are allowed.`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const userId = req.user?.userId;
    const candidate = await this.parserService.parseSingle(file, userId);

    return {
      message: 'CV parsed successfully',
      candidate,
    };
  }
}
