import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Order Module (e2e)', () => {
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
    it('should load OrderModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have order create route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/order/create')
        .send({
          supplierId: 'test-supplier-id',
          items: [
            {
              productId: 'test-product-id',
              qty: 10,
              price: '29.99',
            },
          ],
        });

      expect(response.status).not.toBe(404);
    });

    it('should have order update route registered', async () => {
      const response = await request(app.getHttpServer())
        .put('/order/update/test-id')
        .send({
          status: 'COMPLETED',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have order delete route registered', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/order/delete/test-id',
      );

      expect(response.status).not.toBe(404);
    });
  });
});
