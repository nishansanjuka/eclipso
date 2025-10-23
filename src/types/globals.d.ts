/// <reference types="@clerk/express/env" />

declare global {
  namespace Express {
    interface Request {
      user: ReturnType<typeof import('@clerk/express').getAuth>;
      clerkEvent: import('@clerk/express').WebhookEvent | null;
    }
  }
}

export type AuthUserObject = ReturnType<
  typeof import('@clerk/express').getAuth
>;

export {};
