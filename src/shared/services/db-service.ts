export interface DbService {
  query(sql: string): Promise<unknown>;
  initialize(): Promise<unknown>;
  createViews(sources: { name: string; url: string }[]): Promise<void>;
}

let _service: DbService | null = null;

export function setDbService(service: DbService): void {
  _service = service;
}

export function getDbService(): DbService {
  if (!_service) throw new Error('DbService not initialized. Call setDbService before rendering.');
  return _service;
}
