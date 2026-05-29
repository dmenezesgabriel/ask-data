import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  architectureLayers,
  classifyArchitectureModule,
  isArchitectureDependencyAllowed,
}: {
  architectureLayers: Record<string, { allowedDependencies: string[] }>;
  classifyArchitectureModule: (modulePath: string) => string | undefined;
  isArchitectureDependencyAllowed: (fromModulePath: string, toModulePath: string) => boolean;
} = require('../../../architecture-boundaries.config.cjs');

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('architecture import boundaries', () => {
  it('classifies Portable BI architecture modules by source path', () => {
    expect(classifyArchitectureModule('src/core/entities/dashboard.ts')).toBe('core');
    expect(classifyArchitectureModule('src/features/ask/ui/ask-input/ask-input.ts')).toBe(
      'features',
    );
    expect(classifyArchitectureModule('src/adapters/http/http-dashboard-repository.ts')).toBe(
      'adapters',
    );
    expect(classifyArchitectureModule('src/infra/db/db.ts')).toBe('infra');
    expect(classifyArchitectureModule('src/composition/client-only-container.ts')).toBe(
      'composition',
    );
    expect(classifyArchitectureModule('src/app/shell/app-shell.ts')).toBe('app');
    expect(classifyArchitectureModule('src/shared/ui/ui-button/ui-button.ts')).toBe('shared');
    expect(classifyArchitectureModule('src/components/top-nav/top-nav.ts')).toBe('shared');
  });

  it('reports dependency direction for allowed and forbidden boundary fixtures', () => {
    expect(architectureLayers.core!.allowedDependencies).toEqual(['core']);

    expect(
      isArchitectureDependencyAllowed(
        'src/adapters/http/http-dashboard-repository.ts',
        'src/core/entities/dashboard.ts',
      ),
    ).toBe(true);

    expect(
      isArchitectureDependencyAllowed(
        'src/core/entities/dashboard.ts',
        'src/features/dashboard/model/dashboard-config.ts',
      ),
    ).toBe(false);

    expect(
      isArchitectureDependencyAllowed(
        'src/core/entities/dashboard.ts',
        'src/shared/types/dashboard.ts',
      ),
    ).toBe(false);

    expect(
      isArchitectureDependencyAllowed(
        'src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts',
        'src/infra/db/db.ts',
      ),
    ).toBe(false);
  });

  it('rejects a core import from feature code through the lint fitness rule', async () => {
    const eslint = new ESLint({ cwd: projectRoot });
    const [result] = await eslint.lintText(
      [
        "import type { Datasource as DataSourceConfig } from '@/features/datasource/model/datasource-config';",
        'export type Fixture = DataSourceConfig;',
      ].join('\n'),
      { filePath: path.join(projectRoot, 'src/core/architecture-boundary-fixture.ts') },
    );

    expect(result?.messages.some((message) => message.ruleId === 'boundaries/dependencies')).toBe(
      true,
    );
  });

  it('accepts an adapter import from core through the lint fitness rule', async () => {
    const eslint = new ESLint({ cwd: projectRoot });
    const [result] = await eslint.lintText(
      [
        "import type { Datasource } from '@/core/entities';",
        'export type Fixture = Datasource;',
      ].join('\n'),
      { filePath: path.join(projectRoot, 'src/adapters/architecture-boundary-fixture.ts') },
    );

    expect(
      result?.messages.filter((message) => message.ruleId === 'boundaries/dependencies'),
    ).toEqual([]);
  });

  it('AC-002: rejects a core import from broad shared technical types through the lint fitness rule', async () => {
    const eslint = new ESLint({ cwd: projectRoot });
    const [result] = await eslint.lintText(
      [
        "import type { DashboardConfig } from '@/shared/types';",
        'export type Fixture = DashboardConfig;',
      ].join('\n'),
      { filePath: path.join(projectRoot, 'src/core/architecture-boundary-fixture.ts') },
    );

    expect(result?.messages.some((message) => message.ruleId === 'boundaries/dependencies')).toBe(
      true,
    );
  });

  it('AC-003: rejects a feature UI import from infra through the lint fitness rule', async () => {
    const eslint = new ESLint({ cwd: projectRoot });
    const [result] = await eslint.lintText(
      ["import '@/infra/db/db';", 'export const fixture = true;'].join('\n'),
      {
        filePath: path.join(
          projectRoot,
          'src/features/dashboard/ui/architecture-boundary-fixture.ts',
        ),
      },
    );

    expect(result?.messages.some((message) => message.ruleId === 'boundaries/dependencies')).toBe(
      true,
    );
  });

  it('AC-003: rejects a feature UI import from adapters through the lint fitness rule', async () => {
    const eslint = new ESLint({ cwd: projectRoot });
    const [result] = await eslint.lintText(
      [
        "import { DuckDbWasmQueryEngine } from '@/adapters/client/duckdb-wasm/duckdb-query-engine';",
        'export const fixture = new DuckDbWasmQueryEngine();',
      ].join('\n'),
      {
        filePath: path.join(
          projectRoot,
          'src/features/dashboard/ui/architecture-boundary-fixture.ts',
        ),
      },
    );

    expect(result?.messages.some((message) => message.ruleId === 'boundaries/dependencies')).toBe(
      true,
    );
  });

  it('AC-004: keeps global DB service imports out of source files outside composition and adapters', () => {
    const offenders = collectTypeScriptFiles(path.join(projectRoot, 'src'))
      .filter((filePath) => {
        const relative = path.relative(projectRoot, filePath).replaceAll(path.sep, '/');
        const layer = classifyArchitectureModule(relative);
        if (layer === 'composition' || layer === 'adapters') return false;
        return fs
          .readFileSync(filePath, 'utf8')
          .includes(['@/shared/services', 'db-service'].join('/'));
      })
      .map((filePath) => path.relative(projectRoot, filePath).replaceAll(path.sep, '/'));

    expect(offenders).toEqual([]);
  });

  it('AC-001: keeps UI modules from importing feature data registries directly', () => {
    const offenders = collectTypeScriptFiles(path.join(projectRoot, 'src'))
      .filter((filePath) => {
        const relative = path.relative(projectRoot, filePath).replaceAll(path.sep, '/');
        if (!relative.includes('/ui/')) return false;
        return importsFeatureDataRegistry(fs.readFileSync(filePath, 'utf8'));
      })
      .map((filePath) => path.relative(projectRoot, filePath).replaceAll(path.sep, '/'));

    expect(offenders).toEqual([]);
  });
});

function importsFeatureDataRegistry(source: string): boolean {
  let searchFrom = 0;

  while (searchFrom < source.length) {
    const importIndex = source.indexOf('import', searchFrom);
    if (importIndex === -1) return false;

    const statementEnd = source.indexOf(';', importIndex);
    const statement = source.slice(
      importIndex,
      statementEnd === -1 ? source.length : statementEnd + 1,
    );

    if (
      statement.includes('/data/') &&
      statement.includes('registry') &&
      (statement.includes("'") || statement.includes('"'))
    ) {
      return true;
    }

    searchFrom = statementEnd === -1 ? source.length : statementEnd + 1;
  }

  return false;
}

function collectTypeScriptFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(fullPath);
    return /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  });
}
