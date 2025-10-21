import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import express from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Req() req: express.Request): Promise<string> {
    console.log(await req.user.getToken());
    return this.appService.getHello();
  }
}
