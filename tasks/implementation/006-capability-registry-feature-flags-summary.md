---
id: '006'
issue: 'tasks/issues/006-add-capability-registry-and-feature-flags.md'
created: 2026-05-25
updated: 2026-05-25
---

# Implementation Summary: Capability Registry and Feature Flags

## Task Implemented

Implemented Task 006: Add capability registry and feature flag evaluation.

## Files Changed

- `src/core/platform/*`: added feature flag provider, resolved capability snapshots, disabled capability errors, and observability event names.
- `src/composition/platform-capabilities.ts`: registered built-in datasource and visualization capabilities with default-enabled static flags.
- `src/composition/client-only-container.ts` and `src/composition/client-server-container.ts`: exposed capability snapshots through deployment composition.
- `src/core/application/use-cases/datasources/create-datasource.ts`: enforced datasource connector capability availability in the application flow.
- `src/features/datasource/**`: filtered datasource type choices from capability snapshots.
- `src/features/question/**` and `src/features/dashboard/**`: filtered visualization choices from capability snapshots and rejected disabled chart selections in widget save flow.
- `src/core/platform/contracts.ts` and `src/core/platform/capability-registry.ts`: tightened capability snapshot immutability at type and runtime boundaries.
- `src/features/dashboard/ui/widget-editor/widget-editor.spec.ts`: added dashboard widget editor regression coverage for seed dashboard chart types.
- `src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts`: expanded smoke coverage across dashboard, datasource, and question screens.

## Behavior Implemented

- Feature flags default to enabled when no explicit value exists.
- Capability resolution combines registered contributions with static flag evaluation.
- UI receives a read-only enabled capability snapshot instead of direct deployment or adapter checks.
- Snapshot capability entries are read-only in TypeScript and frozen at runtime before reaching UI/application callers.
- Disabled datasource connector creation fails closed with `CapabilityDisabledError`.
- Disabled visualization capabilities are not listed in question/widget editor chart selectors.
- Default client-only and client-server composition still exposes current datasource and chart behavior.

## Design Notes

- Flag checks are centralized in `CapabilityRegistry` resolution.
- Built-in datasource connectors and chart renderers register through the platform contribution contract.
- ADRs remain `Proposed` because the issue marks initial flag-source/default-policy approval as HITL.

## Tests Added Or Updated

- `UT-001`: static feature flag provider returns defaults for unspecified flags.
- `UT-002`: registry excludes flag-disabled capabilities from contributions and snapshots.
- `UT-003`: disabled capability access throws a stable domain error and emits redacted caller context.
- `IT-001`: client-only composition resolves built-in datasource and visualization capabilities.
- `AC-002`: datasource creation returns `CapabilityDisabledError` for disabled connectors.
- `AC-004`: different flag adapters produce deterministic snapshots.
- `UX-001`: disabled datasource and visualization capabilities are hidden from affected selectors.
- `ST-001`: existing capability serialization test continues to verify no secret fields are exposed.
- `IT-001`: capability snapshots are deeply read-only, including the outer snapshot, array, and capability entries.
- `REG-001`: default client-only chart capabilities include chart types used by seed dashboards, and the widget editor exposes those chart types when opened.
- `SMK-001`: dashboard, datasource, and question screens load without external flag configuration.
- `OT-001`: duplicate registration emits redacted failure context with capability ID and contribution type.

## Validations Run

- `npm run test:unit -- src/core/platform/capability-registry.spec.ts src/composition/platform-capabilities.spec.ts src/composition/use-cases.spec.ts`
- `npm run test:components -- src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:components`
- `npm run build`
- `npm run lint`
- `npm run test:unit -- src/core/platform/capability-registry.spec.ts src/composition/platform-capabilities.spec.ts`
- `npm run test:components -- src/features/dashboard/ui/widget-editor/widget-editor.spec.ts src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts`
- `npm run typecheck`
- `npx eslint src/core/platform/contracts.ts src/core/platform/capability-registry.ts src/core/platform/capability-registry.spec.ts src/composition/platform-capabilities.spec.ts src/features/dashboard/ui/widget-editor/widget-editor.spec.ts src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts`

## Observability Added Or Changed

- Capability registration success/failure events are emitted through registry event callbacks.
- Disabled capability access attempts emit `platform.capability.access.disabled` with capability ID, contribution type, and caller context only.
- Registration failure emission is now covered by an explicit observability test for redacted capability ID and contribution type context.

## ADRs Updated

- Not updated. ADR 002 and ADR 004 are still pending HITL approval per the issue.

## Skipped Or Not-Applicable Test Categories

- End-to-end tests: not applicable because this task changes capability availability rather than a full new user journey.
- Performance tests: not applicable because capability resolution is small in-memory configuration.
- Security tests beyond metadata serialization: not applicable because no auth, permission, or external secret boundary changed.

## Unresolved Assumptions Or Follow-Up Work

- ADR 004 still needs human approval for initial flag sources and default capability policy before being marked accepted.
