import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Candidate } from './entities/candidate.entity';
import { Experience } from './entities/experience.entity';
import { Education } from './entities/education.entity';
import { Template } from './entities/template.entity';
import { User } from './entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ParserModule } from './parser/parser.module';
import { CandidatesModule } from './candidates/candidates.module';
import { PdfModule } from './pdf/pdf.module';
import { TeamtailorModule } from './teamtailor/teamtailor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Candidate, Experience, Education, Template, User],
        synchronize: true, // Auto-crea las tablas en Postgres la primera vez que se inicia
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Candidate, Experience, Education, Template, User]),
    AuthModule,
    ParserModule,
    CandidatesModule,
    PdfModule,
    TeamtailorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
