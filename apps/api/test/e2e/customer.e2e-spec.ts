import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Customer Module (e2e)', () => {
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
    it('should load CustomerModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have customer routes registered', async () => {
      // Test that the module and routes are loaded
      // Without auth, we expect validation errors (400) or auth errors (500)
      // but NOT 404 (route not found)
      const response = await request(app.getHttpServer())
        .post('/customers/create')
        .send({
          name: 'Test Customer',
          phone: '+1234567890',
          email: 'test@example.com',
        });

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
    });
  });
});
