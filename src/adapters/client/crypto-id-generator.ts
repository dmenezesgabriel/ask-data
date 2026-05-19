import type { IdGenerator } from '@/core/application/ports';

export class CryptoIdGenerator implements IdGenerator {
  create(): string {
    return crypto.randomUUID();
  }
}
