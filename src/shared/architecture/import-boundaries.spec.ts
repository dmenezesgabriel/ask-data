import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  classifyArchitectureModule,
  isArchitectureDependencyAllowed,
}: {
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

    expect(result?.messages.filter((message) => message.ruleId === 'boundaries/dependencies')).toEqual(
      [],
    );
  });

  it('AC-004: keeps global DB service imports out of source files outside composition and adapters', () => {
    function collectTypeScriptFiles(directory: string): string[] {
      return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectTypeScriptFiles(fullPath);
        return /\.tsx?$/.test(entry.name) ? [fullPath] : [];
      });
    }

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
});
