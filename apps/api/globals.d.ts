/// <reference types="@clerk/express/env" />

declare global {
  namespace Express {
    interface Request {
      /** Set by AuthMiddleware: verified identity + DB-backed permissions. */
      user: import('./src/modules/auth/domain/auth-context').AuthContext;
      clerkEvent: import('@clerk/express').WebhookEvent | null;
    }
  }
}

export type AuthUserObject =
  import('./src/modules/auth/domain/auth-context').AuthContext;

export {};
