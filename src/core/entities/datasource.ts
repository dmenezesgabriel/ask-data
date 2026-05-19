export type DataSourceType = 'csv' | 'parquet' | 'json';

export interface Datasource {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: DataSourceType;
  url: string;
  source: 'yaml' | 'user';
  createdAt: string;
  updatedAt: string;
}
