import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Eclipso POS API')
    .setDescription(
      'A comprehensive RESTful API for the Eclipso Point-of-Sale system. This API provides secure endpoints for authentication, multi-tenant organization management, user administration, and core business operations. Built with NestJS and designed for retail and hospitality environments, it supports real-time synchronization, role-based access control, and seamless third-party integrations.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'Authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  document.security = [{ Authorization: [] }];

  SwaggerModule.setup('api', app, document);

  app
    .getHttpAdapter()
    .get('/api-json', (req: express.Request, res: express.Response) => {
      res.json(document);
    });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
