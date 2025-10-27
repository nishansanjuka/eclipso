import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import express from 'express';
import { logDebug } from '@eclipso/utils';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req: express.Request): string {
    logDebug('Request user:', req.user);
    return this.appService.getHello();
  }
}
