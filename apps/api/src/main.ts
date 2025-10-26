import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Abc')
    .setDescription('aa')
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
