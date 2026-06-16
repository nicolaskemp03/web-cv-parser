import { Controller, Get, Post, Query, Param, UseGuards, Req } from '@nestjs/common';
import { TeamtailorService } from './teamtailor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/teamtailor')
@UseGuards(JwtAuthGuard)
export class TeamtailorController {
  constructor(private readonly teamtailorService: TeamtailorService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    const results = await this.teamtailorService.searchCandidates(query);
    // Extraer solo lo necesario para el frontend
    return results.map((c: any) => ({
      id: c.id,
      nombres: c.attributes['first-name'],
      apellidos: c.attributes['last-name'],
      email: c.attributes.email,
      titulo: c.attributes.title,
      picture: c.attributes.picture,
    }));
  }

  @Post('import/:id')
  async importCandidate(@Param('id') id: string, @Req() req: any) {
    const candidate = await this.teamtailorService.importCandidate(id, req.user?.userId);
    return {
      message: 'Candidato importado y parseado exitosamente',
      candidate,
    };
  }
}
