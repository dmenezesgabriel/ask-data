import { describe, expect, it } from 'vitest';

import { generateUniqueSlug, nameToSlug } from './slug';

describe('nameToSlug', () => {
  it('lowercases, trims, and replaces non-alphanumeric runs with hyphens', () => {
    expect(nameToSlug('Sales by Region')).toBe('sales-by-region');
  });

  it('strips leading and trailing hyphens', () => {
    expect(nameToSlug('  --My DS--  ')).toBe('my-ds');
  });

  it('returns the fallback when the result would be empty', () => {
    expect(nameToSlug('---', 'datasource')).toBe('datasource');
  });

  it('uses "item" as the default fallback', () => {
    expect(nameToSlug('!!!')).toBe('item');
  });
});

describe('generateUniqueSlug', () => {
  it('returns base when slug is not taken', () => {
    expect(generateUniqueSlug('my-name', () => false)).toBe('my-name');
  });

  it('returns base-2 when base is already taken', () => {
    expect(generateUniqueSlug('my-name', (s) => s === 'my-name')).toBe('my-name-2');
  });

  it('returns base-3 when base and base-2 are already taken', () => {
    expect(generateUniqueSlug('my-name', (s) => ['my-name', 'my-name-2'].includes(s))).toBe(
      'my-name-3',
    );
  });
});
