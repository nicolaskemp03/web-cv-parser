import { Module } from '@nestjs/common';
import { TeamtailorService } from './teamtailor.service';
import { TeamtailorController } from './teamtailor.controller';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [ParserModule],
  providers: [TeamtailorService],
  controllers: [TeamtailorController]
})
export class TeamtailorModule {}
