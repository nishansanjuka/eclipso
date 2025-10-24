import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import 'dotenv/config';

@Injectable()
class AuthMiddleware implements NestMiddleware {
  private clerk = clerkMiddleware();

  use(req: Request, res: Response, next: NextFunction) {
    this.clerk(req, res, (err?: any) => {
      if (err) return next(err);

      // Get auth state from the request
      const auth = getAuth(req);
      req.user = auth;

      console.log(auth);

      // Check if user is authenticated
      if (!auth.userId) {
        throw new UnauthorizedException('Unauthorized');
      }

      next();
    });
  }
}

export default AuthMiddleware;
