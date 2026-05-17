---
id: '001'
issue: 'issues/001-scaffold-devcontainer.md'
created: 2026-05-16
updated: 2026-05-16
---

# Implementation Summary: Scaffold devcontainer with secure Node.js base image

## Related Task

- `issues/001-scaffold-devcontainer.md`

## Files Changed

- `.devcontainer/Dockerfile` — new; Node.js LTS devcontainer image with pnpm, Oh My Zsh, and zsh-autosuggestions
- `.devcontainer/devcontainer.json` — new; VS Code devcontainer config with extensions, postCreateCommand, and workspace mount
- `.devcontainer/.gitignore` — new; excludes `.env` files from the devcontainer directory
- `docker-compose.yml` — new; defines `devcontainer` service that builds from `.devcontainer/` and mounts workspace
- `docs/adrs/001-devcontainer-base-image.md` — updated Status from `Proposed` to `Accepted`; Decision set to chosen option
- `docs/adrs/002-devcontainer-user-context.md` — updated Status from `Proposed` to `Accepted`; Decision set to chosen option

## Behavior Implemented

- Opening the repo in VS Code Dev Containers triggers a build from `node:lts-bookworm-slim`.
- `postCreateCommand` runs `pnpm install && echo "devcontainer ready"` so the developer can immediately run `pnpm test` after the container starts.
- Zsh with Oh My Zsh and zsh-autosuggestions is the default shell inside the container.
- The workspace is bind-mounted at `/workspace` with `cached` mode for performance.
- VS Code extensions for ESLint, Vitest, Lit plugin, and TypeScript are pre-installed on container open.

## Design Notes

- Base image is `node:lts-bookworm-slim` per ADR 001 — Node.js LTS pre-installed, Debian Slim for apt compatibility, no manual Node.js install step.
- Container runs as root per ADR 002 — matches the reference pattern; avoids UID mismatch on Linux bind mounts; acceptable for a dev-only container.
- All apt installs are in a single `RUN` layer with `rm -rf /var/lib/apt/lists/*` to minimise image size (FR-002, NFR-004).
- pnpm is installed globally via `npm install -g pnpm` as a dedicated layer (FR-003).
- No `runServices` key in `devcontainer.json` — this project has no additional compose services (unlike the reference which runs LocalStack).
- No `.vscode/extensions.json` existed in the project; extensions list is derived from the project stack (Vite + TypeScript + Lit + ESLint + Vitest) as specified in FR-008.
- No secrets or credentials appear in any Dockerfile layer or `devcontainer.json` (FR-009, OBS-002).

## Tests Added or Updated

Not applicable — this task produces infrastructure files (Dockerfile, docker-compose.yml, devcontainer.json) with no domain logic units to test.

## Test Categories Not Applicable

- `Unit`: Not applicable — no domain logic or isolated functions are introduced.
- `Component`: Not applicable — no UI components are introduced.
- `E2E`: Not applicable — no complete application user journey is affected.
- `Regression`: Not applicable — no known previous defect related to this task.
- `Usability`: Not applicable — no user-facing UI is introduced.
- `Observability`: Not applicable — no application-level logs, metrics, or traces are introduced.

Integration and smoke tests (`IT-001`, `SMK-001`, `SMK-002`, `SMK-003`) and performance/security tests (`PT-001`, `PT-002`, `ST-001`, `ST-002`) are manual steps requiring a Docker-capable host with the container running.

## Validation Run

```text
docker compose config --quiet — EXIT 0 (valid YAML)
python3 json.load devcontainer.json — valid JSON
grep secrets in .devcontainer/ — ST-001 passed: no secrets in devcontainer files
```

## Accessibility Notes

Not applicable — this task does not change user-facing UI.

## Observability Changes

- `postCreateCommand` appends `echo "devcontainer ready"` after `pnpm install` (OBS-001).
- No application-level logs, metrics, or traces are introduced.

## ADR Updates

- `docs/adrs/001-devcontainer-base-image.md` — updated from `Proposed` to `Accepted`; Decision: "Use `node:lts-bookworm-slim` as the base image."
- `docs/adrs/002-devcontainer-user-context.md` — updated from `Proposed` to `Accepted`; Decision: "Run as root (no USER directive). Acceptable for a local development container that never runs in production."

## Unresolved Assumptions or Follow-Up

- `IT-001`, `SMK-001`–`SMK-003`, `PT-001`, `PT-002`, `ST-002` are manual tests requiring a Docker-capable host — not run here due to host resource constraints.
- Node.js version is pinned to the `lts` tag, not a specific digest; fully reproducible builds would require digest pinning (open question from ADR 001).
- No weekly image rebuild schedule is configured; this is deferred to a follow-up task if needed.
