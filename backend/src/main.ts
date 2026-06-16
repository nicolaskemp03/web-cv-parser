import * as dotenv from 'dotenv';
import * as path from 'path';
// Forzamos la carga del .env raíz antes de que inicie cualquier cosa
dotenv.config({ path: path.join(__dirname, '../../../.env') });
// También probamos una ruta alternativa por si se ejecuta desde otra carpeta
dotenv.config({ path: path.join(process.cwd(), '../.env') });

process.env.TZ = 'UTC';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Hardening & Security
  app.use(helmet());
  app.use(compression());

  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>('FRONTEND_URL') || `http://localhost:${configService.get<string>('FRONTEND_PORT') || 5173}`;

  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || configService.get<number>('PORT') || 3001;
  console.log(`[Bootstrap] Starting server on port: ${port}`);
  await app.listen(port);
}
bootstrap();
