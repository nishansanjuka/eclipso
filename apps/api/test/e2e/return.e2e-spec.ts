import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Return Module (e2e)', () => {
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
    it('should load ReturnModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have return routes registered', async () => {
      // Without auth, we expect errors but NOT 404 (route not found)
      const response = await request(app.getHttpServer())
        .post('/returns/create')
        .send({
          saleId: 'sale-id',
          qty: 1,
          reason: 'DEFECTIVE',
          status: 'PENDING',
          notes: 'Product stopped working',
          items: [
            {
              saleItemId: 'sale-item-id',
              qtyReturned: 1,
            },
          ],
        });

      expect(response.status).not.toBe(404);
    });
  });
});
