import type { DatasourceRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

import { NotImplementedError } from './http-error';

export class HttpDatasourceRepository implements DatasourceRepository {
  constructor(private readonly baseUrl: string = '/api/datasources') {}

  async list(): Promise<Datasource[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error(`Failed to list datasources: ${res.status}`);
    return res.json() as Promise<Datasource[]>;
  }

  async get(id: string): Promise<Datasource | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to get datasource: ${res.status}`);
    return res.json() as Promise<Datasource>;
  }

  async save(_datasource: Datasource): Promise<void> {
    throw new NotImplementedError(`${this.baseUrl} save`);
  }

  async delete(id: string): Promise<void> {
    throw new NotImplementedError(`${this.baseUrl}/${id} delete`);
  }
}
