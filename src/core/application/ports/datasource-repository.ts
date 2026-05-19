import type { Datasource } from '@/core/entities';

export interface DatasourceRepository {
  list(): Promise<Datasource[]>;
  get(id: string): Promise<Datasource | null>;
  save(datasource: Datasource): Promise<void>;
  delete(id: string): Promise<void>;
}
