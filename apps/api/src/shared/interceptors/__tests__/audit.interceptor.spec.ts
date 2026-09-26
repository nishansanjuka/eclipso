import { lastValueFrom, of } from 'rxjs';
import { AuditInterceptor } from '../audit.interceptor';

function contextFor(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('AuditInterceptor', () => {
  const service = { createLog: jest.fn().mockResolvedValue(undefined) };
  const interceptor = new AuditInterceptor(service as never);

  beforeEach(() => service.createLog.mockClear());

  it('lets a public request (no user) succeed and logs nothing', async () => {
    const request = {
      method: 'GET',
      url: '/public/workspaces/keels/exists',
      headers: {},
      socket: {},
    };
    const result = await lastValueFrom(
      interceptor.intercept(contextFor(request), {
        handle: () => of({ exists: true }),
      }),
    );
    expect(result).toEqual({ exists: true });
    expect(service.createLog).not.toHaveBeenCalled();
  });

  it('logs authenticated requests and redacts invitation links', async () => {
    const request = {
      method: 'POST',
      url: '/invitations',
      body: {},
      headers: {},
      socket: {},
      user: { userId: 'user_1', orgId: 'biz_1' },
    };
    await lastValueFrom(
      interceptor.intercept(contextFor(request), {
        handle: () =>
          of({
            results: [
              { email: 'a@x.lk', inviteUrl: 'https://x/invite/SECRET' },
            ],
          }),
      }),
    );
    await new Promise((r) => setImmediate(r));

    expect(service.createLog).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(service.createLog.mock.calls[0][0]);
    expect(logged).not.toContain('SECRET');
    expect(logged).toContain('REDACTED');
  });
});
