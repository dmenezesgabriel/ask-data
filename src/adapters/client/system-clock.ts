import type { Clock } from '@/core/application/ports';

export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}
