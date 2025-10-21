import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './shared/config';
import express from 'express';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
      imports: [
        NestConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', async () => {
      const mockReq: express.Request = {
        user: {
          getToken: jest.fn().mockResolvedValue('mock-token'),
        },
      } as unknown as express.Request;

      const result = await appController.getHello(mockReq);
      expect(result).toBe('Hello World!');
      expect(mockReq.user.getToken).toHaveBeenCalled();
    });
  });
});
