# ADR 004: Standardize Feature Flags and Observability Boundaries

## Status

Proposed

## Date

2026-05-24

## Context

Portable BI needs feature flags for capabilities and extensions, plus observability that works across client-only, client-server, serverless, monolith, and microservice modes. Today logging exists in `shared/observability`, while feature availability is mostly encoded in configuration or direct imports.

## Decision

Introduce application-level ports for feature flag evaluation and observability events. Feature flags should resolve capabilities during composition and expose a stable capability snapshot to UI/use cases. Observability should capture use-case outcomes and adapter failures without leaking sensitive datasource URLs, SQL literals, field samples, or user-entered questions unless explicitly allowed.

## Options Considered

1. Read feature flags directly from UI components and log from any module.
2. Centralize feature flag and observability contracts at application boundaries. `(recommended)`
3. Defer feature flags and observability until after extension loading exists.

## Consequences

Positive:
- Capabilities can be enabled per deployment mode, workspace, or extension set.
- Telemetry can remain consistent when deployment topology changes.
- Tests can verify disabled capabilities and telemetry redaction.

Negative:
- Adds a small amount of composition and adapter code before all flags are externally backed.
- Requires discipline to avoid direct `console` or environment checks in domain flows.

## Validation

- Unit tests verify flag evaluation without browser or network APIs.
- Integration tests verify disabled capabilities are not returned by the capability registry.
- Observability tests verify sensitive values are redacted.

## Open Questions

- Should initial flags be static build-time configuration, runtime configuration, or both?
- Which BI data fields are always considered sensitive for logs and analytics?
