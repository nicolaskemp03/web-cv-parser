import { Test, TestingModule } from '@nestjs/testing';
import { TeamtailorController } from './teamtailor.controller';

describe('TeamtailorController', () => {
  let controller: TeamtailorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamtailorController],
    }).compile();

    controller = module.get<TeamtailorController>(TeamtailorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
