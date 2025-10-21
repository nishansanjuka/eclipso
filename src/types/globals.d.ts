/// <reference types="@clerk/express/env" />

declare global {
  namespace Express {
    interface Request {
      user: ReturnType<typeof import('@clerk/express').getAuth>;
    }
  }
}

export {};
