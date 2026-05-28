---
id: "012"
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Fix post-create dashboard navigation stuck on "Loading dashboard..."

## Priority

P0 — Blocks users from editing a newly created dashboard; the editor is unreachable via the create flow until this is fixed.

## Dependencies

- No task dependency; this is a self-contained one-line fix in `app-shell.ts`.
- No ADR dependency; this task uses existing routing architecture.

## Assignability

**AFK** — all requirements and acceptance criteria are resolved; no irreversible architectural decisions remain open.

## Context

After a user creates a dashboard, `_onDashboardCreate()` in `src/app/shell/app-shell.ts:92` navigates with `{ view: 'editor', slug: dashboard.id, isNew: true }`. This produces the hash `#/dashboard/new/<slug>`.

`_loadDashboardForRoute()` treats `isNew: true` as a signal to call `createEmptyDashboardConfig()` instead of fetching the persisted entity from storage. The dashboard IS persisted correctly — navigating directly to `#/dashboard/<slug>` works — but the `new/` prefix path produces empty or inconsistent state that leaves the shell stuck on "Loading dashboard...".

The fix is to drop `isNew: true` from the post-create navigation so the shell follows the normal load path (fetch from storage), identical to direct URL access.

## Use Cases

- **Feature**: Dashboard creation
- **Scenario**: Analyst creates a new dashboard and is taken to the editor
- **Given** an analyst is on the dashboard list
- **When** they submit the create-dashboard form with a valid name
- **Then** the dashboard is persisted **And** the editor opens showing the saved dashboard

## Definition of Ready

- `src/app/shell/app-shell.ts` and `src/app/routing/hash-routes.ts` are available.
- The `_onDashboardCreate()` method and `_loadDashboardForRoute()` are understood.
- No external API changes required.

## Functional Requirements

- `FR-001`: After creating a dashboard, the shell navigates to `#/dashboard/<slug>` (without the `new/` prefix).
- `FR-002`: The dashboard editor loads the persisted dashboard entity, not an empty placeholder.
- `FR-003`: No regression: navigating directly to `#/dashboard/<slug>` continues to work.

## Non-Functional Requirements

- `NFR-001`: The fix is a single-expression change inside `_onDashboardCreate()`.

## Observability Requirements

- `OBS-001`: Not applicable — this task changes only routing logic and introduces no new operational behavior.

## Acceptance Criteria

- `AC-001`: **Given** a user creates a dashboard named "Q1 Sales", **When** the create flow completes, **Then** the browser hash is `#/dashboard/<slug>` (no `new/` segment).
- `AC-002`: **Given** a user creates a dashboard, **When** the editor opens, **Then** the dashboard title matches the name entered in the create form (no "Loading dashboard..." displayed).
- `AC-003`: **Given** an existing dashboard slug, **When** navigating to `#/dashboard/<slug>` directly, **Then** the editor loads without regression.

## Required Tests

### Unit Tests

- `UT-001`: Verify that after `createDashboard` resolves, `_navigate` is called with `{ view: 'editor', slug: dashboard.id }` and NOT with `isNew: true`. Covers `FR-001`, `AC-001`.

### Integration Tests

Not applicable — the fix is inside a client-side Lit component with no service boundary crossed.

### Smoke Tests

Not applicable — existing `SMK-001` in `app-shell.smoke.spec.ts` covers shell startup; no new shallow-path risk introduced.

### End-to-End Tests

Not applicable — the dashboard creation journey is covered by existing E2E scenarios; no new journey introduced.

### Regression Tests

- `REG-001`: **Scenario**: Post-create navigation does not contain `new/`
  **Given** the app is loaded
  **When** a dashboard is created via the create form
  **Then** `window.location.hash` does not contain `/new/`
  **And** the editor renders the dashboard title instead of "Loading dashboard..."
  Covers previous defect `BUG-1`.

### Performance Tests

Not applicable — one-line routing change with no performance impact.

### Security Tests

Not applicable — no authentication, authorization, or input handling changed.

### Usability Tests

Not applicable — the fix restores existing expected behavior; no new UX states introduced.

### Observability Tests

Not applicable — no telemetry added or changed.

## Definition of Done

- Code is implemented inside `_onDashboardCreate()` in `src/app/shell/app-shell.ts`.
- Required tests pass.
- Loading, empty, and error states for the editor remain handled (no regression).
