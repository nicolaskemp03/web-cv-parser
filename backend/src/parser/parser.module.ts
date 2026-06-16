import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { OpenAIService } from './openai.service';
import { ConverterService } from './converter.service';
import { CandidatesModule } from '../candidates/candidates.module';

@Module({
  imports: [
    CandidatesModule,
  ],
  controllers: [ParserController],
  providers: [ParserService, OpenAIService, ConverterService],
})
export class ParserModule {}
