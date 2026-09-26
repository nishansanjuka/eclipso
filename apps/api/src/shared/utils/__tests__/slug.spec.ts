import { isValidSlug, slugify } from '../slug';

describe('slug', () => {
  it('accepts DNS-safe workspace addresses', () => {
    for (const s of ['keels', 'def-org', 'aperture-retail', 'a1b', 'shop-42']) {
      expect(isValidSlug(s)).toBe(true);
    }
  });

  it('rejects unsafe, malformed and reserved ones', () => {
    for (const s of [
      'ab', // too short
      '-keels',
      'keels-',
      'Keels', // upper case
      'kee ls',
      'kee_ls',
      'a--b',
      'www',
      'app',
      'api',
      'a'.repeat(41),
      'ke.els',
    ]) {
      expect(isValidSlug(s)).toBe(false);
    }
  });

  it('derives a slug from a business name', () => {
    expect(slugify('Keels Super (Pvt) Ltd')).toBe('keels-super-pvt-ltd');
    expect(slugify('  Café  Nimal & Sons ')).toBe('cafe-nimal-sons');
    expect(slugify('!!!')).toBe('');
    expect(slugify('x'.repeat(80)).length).toBeLessThanOrEqual(40);
  });
});
