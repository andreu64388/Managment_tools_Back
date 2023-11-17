import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);

  const corsOptions = {
    origin: configService.get<string>('CORS_ORIGIN'),
  };

  const config = new DocumentBuilder()
    .setTitle('Currency API')
    .setDescription('REST API for currency')
    .setVersion('1.0')
    .addTag('currency')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors(corsOptions);

  await app.listen(process.env.PORT, '0.0.0.0');
}

bootstrap();
