import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Módulo de Conocimientos (MOCO-API)')
    .setDescription('API para la gestión y recuperación de documentos basada en vectores')
    .setVersion('0.2')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  Logger.log(
    `🚀 Servidor corriendo en: http://localhost:${process.env.PORT ?? 3000}`,
    'Bootstrap',
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
