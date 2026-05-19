export class NotImplementedError extends Error {
  constructor(endpoint: string) {
    super(`HTTP adapter not yet implemented: ${endpoint}`);
    this.name = 'NotImplementedError';
  }
}
