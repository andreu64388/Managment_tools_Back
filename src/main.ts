import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);

  app.use(compression());
  app.use(cors());

  const apiPrefix = 'api';
  app.setGlobalPrefix(apiPrefix);

  const port = configService.get<number>('PORT_APP');
  await app.listen(port);
}

bootstrap();
