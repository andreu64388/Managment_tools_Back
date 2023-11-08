import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.useGlobalPipes(new ValidationPipe());

  var corsOptions = {
    origin: 'http://localhost:3000',
  };
  app.enableCors(corsOptions);
  await app.listen(5000);
}

bootstrap();
