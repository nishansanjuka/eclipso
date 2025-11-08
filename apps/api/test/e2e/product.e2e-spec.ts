import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Product Module (e2e)', () => {
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
    it('should load ProductModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have product create route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/product/create')
        .send({
          name: 'Test Product',
          categoryId: 'test-category-id',
          price: '29.99',
          stockQty: 100,
        });

      expect(response.status).not.toBe(404);
    });

    it('should have product update route registered', async () => {
      const response = await request(app.getHttpServer())
        .put('/product/update/test-id')
        .send({
          name: 'Updated Product',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have product delete route registered', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/product/delete/test-id',
      );

      expect(response.status).not.toBe(404);
    });
  });

  describe('Product Categories', () => {
    it('should have category routes registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/category/create')
        .send({
          name: 'Test Category',
        });

      expect(response.status).not.toBe(404);
    });
  });
});
