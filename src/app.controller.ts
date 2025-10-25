import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import express from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req: express.Request): string {
    console.log(req.user);
    return this.appService.getHello();
  }
}
