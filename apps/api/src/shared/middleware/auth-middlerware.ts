import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import 'dotenv/config';
import { AccessService } from '../../modules/auth/infrastructure/access.service';

export const BUSINESS_HEADER = 'x-business-id';
const BUSINESS_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Authentication + authorization context for every protected route.
 *
 *  - Clerk proves *who* the caller is (verified session token). Nothing about
 *    organizations or roles is read from Clerk.
 *  - Business, role and permissions are loaded from our DB on each request
 *    (via a short server-side cache) and attached as `req.user`.
 */
@Injectable()
class AuthMiddleware implements NestMiddleware {
  private clerk = clerkMiddleware();

  constructor(private readonly access: AccessService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.clerk(req, res, (err?: unknown) => {
      if (err) return next(err);

      const auth = getAuth(req);
      if (!auth.userId) {
        return next(new UnauthorizedException('Unauthorized'));
      }

      let requestedOrgId: string | undefined;
      try {
        requestedOrgId = this.readBusinessHeader(req);
      } catch (error) {
        return next(error);
      }

      this.access
        .resolve(auth.userId, requestedOrgId)
        .then((context) => {
          req.user = context;
          next();
        })
        .catch((error: unknown) => next(error));
    });
  }

  private readBusinessHeader(req: Request): string | undefined {
    const raw = req.headers[BUSINESS_HEADER];
    if (raw === undefined) return undefined;
    if (typeof raw !== 'string' || !BUSINESS_ID_PATTERN.test(raw)) {
      throw new BadRequestException('Invalid X-Business-Id header.');
    }
    return raw;
  }
}

export default AuthMiddleware;
