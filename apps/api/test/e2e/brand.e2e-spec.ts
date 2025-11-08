import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Brand Module (e2e)', () => {
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
    it('should load BrandModule successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have brand create route registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/brand/create')
        .send({
          name: 'Test Brand',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have brand update route registered', async () => {
      const response = await request(app.getHttpServer())
        .put('/brand/update/test-id')
        .send({
          name: 'Updated Brand',
        });

      expect(response.status).not.toBe(404);
    });

    it('should have brand delete route registered', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/brand/delete/test-id',
      );

      expect(response.status).not.toBe(404);
    });
  });
});
