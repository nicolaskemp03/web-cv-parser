import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/candidates')
export class CandidatesController {
  constructor(private candidatesService: CandidatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.candidatesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.candidatesService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.candidatesService.remove(id);
    return { message: 'Candidate deleted successfully' };
  }
}
