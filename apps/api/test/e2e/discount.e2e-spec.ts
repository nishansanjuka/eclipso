import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Discount Module (e2e)', () => {
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
    it('should load DiscountModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have discount create route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/discount/create')
        .send({
          name: 'Summer Sale',
          type: 'PERCENTAGE',
          value: 20,
        });

      expect(response.status).not.toBe(404);
    });

    it('should have discount update route registered', async () => {
      const response = await request(app.getHttpServer())
        .put('/discount/update/test-id')
        .send({
          name: 'Updated Discount',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have discount delete route registered', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/discount/delete/test-id',
      );

      expect(response.status).not.toBe(404);
    });
  });
});
