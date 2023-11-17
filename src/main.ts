import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);

  const corsOptions = {
    origin: configService.get<string>('CORS_ORIGIN'),
  };

  app.enableCors(corsOptions);

  const port = configService.get<number>('PORT_APP');
  await app.listen(port);
}

bootstrap();
