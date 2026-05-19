import { describe, expect, it } from 'vitest';

import { CryptoIdGenerator } from './crypto-id-generator';
import { SystemClock } from './system-clock';

// UT-004: CryptoIdGenerator.create() returns non-empty strings, 100 calls produce 100 unique values
describe('CryptoIdGenerator', () => {
  it('UT-004: create() returns non-empty strings and 100 calls produce 100 unique values', () => {
    const generator = new CryptoIdGenerator();
    const ids = Array.from({ length: 100 }, () => generator.create());
    for (const id of ids) {
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });
});

// UT-005: SystemClock.now() returns a valid ISO 8601 string
describe('SystemClock', () => {
  it('UT-005: now() returns a valid ISO 8601 string', () => {
    const clock = new SystemClock();
    const result = clock.now();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(() => new Date(result)).not.toThrow();
    expect(new Date(result).toISOString()).toBe(result);
  });
});
