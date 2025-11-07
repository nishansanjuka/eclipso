import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Sale Module (e2e)', () => {
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

  describe('POST /sales/create', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/sales/create')
        .send({
          customerId: 'customer-id',
          items: [
            {
              productId: 'product-id',
              qty: 2,
              price: '29.99',
            },
          ],
          payment: {
            method: 'CASH',
            amount: '59.98',
          },
        })
        .expect(401);
    });
  });

  describe('GET /sales/:id', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/sales/test-id').expect(401);
    });
  });

  describe('Module Registration', () => {
    it('should load SaleModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have sale routes registered', async () => {
      // Without auth, we expect errors but NOT 404 (route not found)
      const response = await request(app.getHttpServer())
        .put('/sales/update/test-id')
        .send({
          customerId: 'new-customer-id',
        });

      expect(response.status).not.toBe(404);
    });
  });
});
