import { AccessCache } from '../access.cache';

describe('AccessCache', () => {
  afterEach(() => jest.useRealTimers());

  it('returns stored values until the TTL passes', () => {
    jest.useFakeTimers();
    const cache = new AccessCache<string>(1000);
    cache.set('biz_1', 'u1', 'v');
    expect(cache.get('biz_1', 'u1')).toBe('v');
    jest.advanceTimersByTime(1001);
    expect(cache.get('biz_1', 'u1')).toBeUndefined();
  });

  it('is disabled with a TTL of 0', () => {
    const cache = new AccessCache<string>(0);
    cache.set('biz_1', 'u1', 'v');
    expect(cache.get('biz_1', 'u1')).toBeUndefined();
  });

  it('does not mix up businesses or users', () => {
    const cache = new AccessCache<string>(1000);
    cache.set('biz_1', 'u1', 'a');
    expect(cache.get('biz_2', 'u1')).toBeUndefined();
    expect(cache.get('biz_1', 'u2')).toBeUndefined();
  });

  it('invalidates by member, business and user', () => {
    const cache = new AccessCache<string>(1000);
    cache.set('biz_1', 'u1', 'a');
    cache.set('biz_1', 'u2', 'b');
    cache.set('biz_2', 'u1', 'c');

    cache.invalidateMember('biz_1', 'u1');
    expect(cache.get('biz_1', 'u1')).toBeUndefined();
    expect(cache.get('biz_1', 'u2')).toBe('b');

    cache.invalidateBusiness('biz_1');
    expect(cache.get('biz_1', 'u2')).toBeUndefined();
    expect(cache.get('biz_2', 'u1')).toBe('c');

    cache.invalidateUser('u1');
    expect(cache.get('biz_2', 'u1')).toBeUndefined();
  });

  it('evicts the oldest entry when full', () => {
    const cache = new AccessCache<string>(1000, 2);
    cache.set('b', 'u1', '1');
    cache.set('b', 'u2', '2');
    cache.set('b', 'u3', '3');
    expect(cache.get('b', 'u1')).toBeUndefined();
    expect(cache.get('b', 'u3')).toBe('3');
  });
});
