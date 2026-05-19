import type { DataSourceEntry, DataSourceManager, QueryPort } from '@/core/application/ports';

import { escapeSqlString, quoteIdent } from '../../shared/utils/utils';

export class DuckDBDataSourceManager implements DataSourceManager {
  private db: QueryPort;

  constructor(db: QueryPort) {
    this.db = db;
  }

  async createViews(sources: DataSourceEntry[]): Promise<void> {
    for (const source of sources) {
      await this.db.query(
        `CREATE OR REPLACE VIEW ${quoteIdent(source.name)} AS SELECT * FROM read_csv_auto('${escapeSqlString(source.url)}')`,
      );
    }
  }
}
