import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../entities/candidate.entity';
import { Experience } from '../entities/experience.entity';
import { Education } from '../entities/education.entity';
import { Template } from '../entities/template.entity';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, Experience, Education, Template]),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
