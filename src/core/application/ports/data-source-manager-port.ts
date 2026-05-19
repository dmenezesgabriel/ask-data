export interface DataSourceEntry {
  name: string;
  url: string;
}

export interface DataSourceManager {
  createViews(sources: DataSourceEntry[]): Promise<void>;
}
