# ADR 002: Establish BI Extension Platform

## Status

Proposed

## Date

2026-05-24

## Context

Portable BI should be extensible by final users in the spirit of VS Code and Obsidian. Extension behavior must be possible for datasource connectors, query engines, semantic matching, visualizations, dashboard actions, data transforms, exporters, storage providers, and constrained UI contributions. Extensions must not import internal modules or depend on deployment topology.

## Decision

Define a BI platform API made of explicit extension points, capability metadata, and registration contracts. Built-in functionality should register through the same contracts expected from final-user extensions whenever practical. The platform API belongs at the application boundary; concrete extension loading, sandboxing, packaging, and deployment live outside the core.

## Options Considered

1. Let extensions import internal modules directly.
2. Define explicit extension-point contracts and capability registration APIs. `(recommended)`
3. Delay extension architecture until after all current features are refactored.

## Consequences

Positive:

- Extension APIs become stable, documented, and testable.
- Built-in and user-provided functionality can evolve polymorphically.
- Feature flags can enable or disable capabilities without UI conditionals spreading across the app.

Negative:

- Requires careful versioning of extension contracts.
- Some existing code must be inverted into registries rather than direct imports.

## Validation

- The first public platform contract includes datasource connectors, query executors, semantic model providers, widget renderers, exporters, and storage providers.
- A built-in datasource connector is registered through platform contracts.
- UI reads capability metadata rather than concrete adapter classes.
- Tests prove disabled capabilities are unavailable without removing their code from the bundle.

## Open Questions

- Human approval is still required before marking the first platform contract as accepted.
- When should plugin sandboxing and permission prompts be introduced?
