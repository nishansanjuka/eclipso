import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Adjustment Module (e2e)', () => {
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

  describe('Module Registration', () => {
    it('should load AdjustmentModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have adjustment create route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/adjustment/create')
        .send({
          productId: 'test-product-id',
          qty: 10,
          reason: 'Stock correction',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have adjustment get route registered', async () => {
      const response = await request(app.getHttpServer()).get(
        '/adjustment/test-id',
      );

      expect(response.status).not.toBe(404);
    });
  });
});
