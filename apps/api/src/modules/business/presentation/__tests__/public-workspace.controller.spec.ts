import { PublicWorkspaceController } from '../public-workspace.controller';

describe('PublicWorkspaceController', () => {
  const businesses = {
    slugTaken: jest.fn((slug: string) => Promise.resolve(slug === 'keels')),
  };
  const controller = new PublicWorkspaceController(businesses as never);

  beforeEach(() => businesses.slugTaken.mockClear());

  it('reports whether a workspace address is in use', async () => {
    await expect(controller.exists('keels')).resolves.toEqual({ exists: true });
    await expect(controller.exists('nobody')).resolves.toEqual({
      exists: false,
    });
  });

  it('is case-insensitive', async () => {
    await expect(controller.exists(' KEELS ')).resolves.toEqual({
      exists: true,
    });
  });

  it('never queries for malformed or reserved addresses', async () => {
    for (const slug of ['www', 'app', 'a', 'bad_slug', 'a..b', '-x-']) {
      await expect(controller.exists(slug)).resolves.toEqual({ exists: false });
    }
    expect(businesses.slugTaken).not.toHaveBeenCalled();
  });
});
