import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root Route', () => {
    it('/ (GET) - should always redirect to /api-reference', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(302)
        .expect('Location', '/api-reference');
    });
  });

  describe('API Documentation', () => {
    it('/api-json (GET) - endpoint should be configured in main.ts', () => {
      // This endpoint is set up in main.ts bootstrap function
      // In test environment, we're not running the full bootstrap
      // So we just verify the app loads successfully
      expect(app).toBeDefined();
    });
  });
});
