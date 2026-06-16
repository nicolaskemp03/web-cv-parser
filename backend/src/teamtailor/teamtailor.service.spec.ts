import { Test, TestingModule } from '@nestjs/testing';
import { TeamtailorService } from './teamtailor.service';

describe('TeamtailorService', () => {
  let service: TeamtailorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamtailorService],
    }).compile();

    service = module.get<TeamtailorService>(TeamtailorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
