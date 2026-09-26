import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

jest.mock('./shared/config', () => ({
  ...jest.requireActual('./shared/config'),
  loadConfig: () => ({
    DATABASE_URL: 'postgres://x:x@localhost:1/x',
    CLERK_PUBLISHABLE_KEY: 'pk',
    CLERK_SECRET_KEY: 'sk',
    CLERK_WEBHOOK_SIGNING_SECRET: 'wh',
    ACCESS_CACHE_TTL_MS: 0,
    MAIL_FROM: 'a@b.c',
    WEB_ROOT_DOMAIN: 'x',
    WEB_PROTOCOL: 'http',
    INVITATION_TTL_DAYS: 7,
  }),
}));

/**
 * Catches Nest dependency-injection mistakes (a provider that is not exported,
 * a module that is not imported) at test time instead of at boot. The database
 * is stubbed and lifecycle hooks are not run, so no connection is needed.
 */
it('resolves the whole module graph', async () => {
  const ref = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider('DRIZZLE_CLIENT')
    .useValue({})
    .compile();
  expect(ref).toBeDefined();
}, 60000);
