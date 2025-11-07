import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Supplier Module (e2e)', () => {
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
    it('should load SuppliersModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have supplier create route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/suppliers/create')
        .send({
          name: 'Test Supplier',
          email: 'supplier@example.com',
          phone: '+1234567890',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have supplier update route registered', async () => {
      const response = await request(app.getHttpServer())
        .put('/suppliers/update/test-id')
        .send({
          name: 'Updated Supplier',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have supplier delete route registered', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/suppliers/delete/test-id',
      );

      expect(response.status).not.toBe(404);
    });
  });
});
