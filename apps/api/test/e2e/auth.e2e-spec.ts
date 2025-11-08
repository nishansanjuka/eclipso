import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Auth Module (e2e)', () => {
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
    it('should load AuthModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have organization routes registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/clerk/organization')
        .send({
          name: 'Test Organization',
          businessType: 'retail',
        });

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
    });

    it('should have webhook route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/webhook')
        .send({
          type: 'user.created',
          data: {},
        });

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
    });
  });
});
