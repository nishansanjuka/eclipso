import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Tax Module (e2e)', () => {
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
    it('should load TaxModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have tax create route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/tax/create')
        .send({
          name: 'VAT',
          rate: 20,
          type: 'PERCENTAGE',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have tax update route registered', async () => {
      const response = await request(app.getHttpServer())
        .put('/tax/update/test-id')
        .send({
          name: 'Updated Tax',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have tax delete route registered', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/tax/delete/test-id',
      );

      expect(response.status).not.toBe(404);
    });
  });
});
