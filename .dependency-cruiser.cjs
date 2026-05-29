// Circular dependency detection only.
// Architecture layer boundary enforcement lives in eslint-plugin-boundaries
// (architecture-boundaries.config.cjs + eslint.config.js) — do not duplicate it here.
//
// Policy (FR-005 Option A): no known circular debt was found on first run.
// All circular imports are treated as errors immediately.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular imports cause unpredictable ESM initialization order and Vite warnings.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan modules are unreachable from any entrypoint — likely dead code.',
      from: {
        orphan: true,
        pathNot: [
          // Storybook story entry files
          '\\.stories\\.[tj]sx?$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: ['node_modules', '\\.d\\.ts$', '^dist/', '^coverage/', '^storybook-static/'],
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
