const architectureLayers = {
  core: {
    paths: ['src/core/**'],
    allowedDependencies: ['core'],
  },
  adapters: {
    paths: ['src/adapters/**'],
    allowedDependencies: ['core', 'shared', 'infra'],
  },
  composition: {
    paths: ['src/composition/**'],
    allowedDependencies: ['core', 'adapters', 'features', 'shared', 'infra'],
  },
  features: {
    paths: ['src/features/**'],
    allowedDependencies: ['core', 'shared', 'features'],
  },
  infra: {
    paths: ['src/infra/**'],
    allowedDependencies: ['core', 'shared'],
  },
  shared: {
    paths: ['src/shared/**', 'src/components/**'],
    allowedDependencies: ['shared'],
  },
  app: {
    paths: ['src/app/**'],
    allowedDependencies: ['composition', 'features', 'shared'],
  },
};

const architectureBoundaryElements = Object.entries(architectureLayers).flatMap(([type, layer]) =>
  layer.paths.map((pattern) => ({ type, pattern })),
);

const architectureBoundaryRules = Object.entries(architectureLayers).map(([type, layer]) => ({
  from: { type },
  allow: { to: { type: layer.allowedDependencies } },
}));

function normalizeModulePath(modulePath) {
  return modulePath.replaceAll('\\', '/').replace(/^\/+/, '');
}

function classifyArchitectureModule(modulePath) {
  const normalizedPath = normalizeModulePath(modulePath);

  for (const [layer, definition] of Object.entries(architectureLayers)) {
    const prefixes = definition.paths.map((pathPattern) => pathPattern.replace('/**', '/'));

    if (prefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
      return layer;
    }
  }

  return undefined;
}

function isArchitectureDependencyAllowed(fromModulePath, toModulePath) {
  const fromLayer = classifyArchitectureModule(fromModulePath);
  const toLayer = classifyArchitectureModule(toModulePath);

  if (fromLayer === undefined || toLayer === undefined) {
    return true;
  }

  return architectureLayers[fromLayer].allowedDependencies.includes(toLayer);
}

module.exports = {
  architectureBoundaryElements,
  architectureBoundaryRules,
  architectureLayers,
  classifyArchitectureModule,
  isArchitectureDependencyAllowed,
};
