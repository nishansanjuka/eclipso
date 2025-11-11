import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('/')
export class RootController {
  @Get()
  root(@Res() res: Response) {
    return res.redirect(302, '/api-reference');
  }
}
