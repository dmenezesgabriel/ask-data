---
id: '001'
created: 2026-05-16
updated: 2026-05-16
status: active
---

# Task: Scaffold devcontainer with secure Node.js base image

## Priority

P0 — Must exist before the coding-agents task because Task 002 installs agents into this container layer.

## Dependencies

- Depends on ADR `docs/adrs/001-devcontainer-base-image.md` — base image must be chosen before the Dockerfile is written.
- Depends on ADR `docs/adrs/002-devcontainer-user-context.md` — user context (root vs non-root) affects global pnpm installs and file ownership.
- No task dependency; this is the first task.

## Assignability

**HITL** — requires human to resolve ADR `docs/adrs/001-devcontainer-base-image.md` (base image choice) and ADR `docs/adrs/002-devcontainer-user-context.md` (root vs non-root) before implementation can begin. Both decisions affect the Dockerfile structure and cannot be deferred mid-implementation.

## Context

The repository is a Node.js / Vite / TypeScript / Web Components project (`portable-bi`, v0.1.0) with no existing `.devcontainer/`. The reference pattern at `references/devcontainer-sample/` demonstrates the approach: a minimal Debian Slim Dockerfile, Oh My Zsh with autosuggestions, a `docker-compose.yml` for service orchestration, and a `devcontainer.json` that sets the workspace mount and VS Code extensions. This task adapts that pattern for a Node.js project: the chosen base image includes Node.js LTS, the Dockerfile installs pnpm globally (via `npm install -g pnpm`) and the system tools the project needs (git, zsh, make, curl), and the post-create step runs `pnpm install` so the developer can run tests immediately on first open. pnpm is the preferred package manager for both project dependency installs and global tool installs.

The host machine is memory-constrained (7 GB RAM, ~1.6 GB free). Image size should stay under 1.5 GB. No secrets or credentials may appear in any Docker image layer.

## Use Cases

- **Feature**: Devcontainer project onboarding
- **Scenario**: Developer opens the repo in VS Code Dev Containers for the first time
- **Given** a developer has cloned the repo and has VS Code with the Dev Containers extension installed
- **When** they open the repo in a devcontainer
- **Then** the container builds, the workspace mounts, `pnpm install` runs, and `pnpm test` passes — all without any manual setup steps

---

- **Feature**: Devcontainer project onboarding
- **Scenario**: Developer runs the project test suite inside the container
- **Given** the devcontainer is running and the workspace is mounted
- **When** the developer runs `pnpm test` inside the container terminal
- **Then** vitest, cucumber, and knip all complete without errors related to missing tools or permissions

## Definition of Ready

- ADR `docs/adrs/001-devcontainer-base-image.md` is resolved to `Accepted` with the chosen image tag.
- ADR `docs/adrs/002-devcontainer-user-context.md` is resolved to `Accepted` with the chosen user strategy.
- The project's required Node.js version is confirmed (from `package.json` engines field or `.nvmrc`).
- The list of VS Code extensions to pre-install is agreed (at minimum: ESLint, Vite, TypeScript extensions used by the project).

## Functional Requirements

- `FR-001`: The `.devcontainer/Dockerfile` uses the base image chosen in ADR 001 with a pinned LTS tag.
- `FR-002`: The Dockerfile installs `git`, `zsh`, `make`, `curl`, `ca-certificates`, and `unzip` via apt in a single layer, removing apt lists afterwards.
- `FR-003`: The Dockerfile installs pnpm globally via `npm install -g pnpm` as a dedicated `RUN` step, making it available for both project installs and subsequent global tool installs.
- `FR-004`: The Dockerfile installs Oh My Zsh (non-interactive) with the `zsh-autosuggestions` plugin, matching the reference pattern.
- `FR-005`: Zsh is set as the default shell for the container user.
- `FR-006`: A `docker-compose.yml` at the project root defines a `devcontainer` service that builds from `.devcontainer/` and mounts `.:/workspace:cached`.
- `FR-007`: The `.devcontainer/devcontainer.json` sets `workspaceFolder` to `/workspace`, references `docker-compose.yml`, and runs `pnpm install` as the `postCreateCommand`.
- `FR-008`: `devcontainer.json` sets useful VS Code extensions (TypeScript, ESLint, Vite, Vitest runner at minimum).
- `FR-009`: No secrets, API keys, credentials, or hardcoded env vars appear in any Docker image layer or `devcontainer.json`.
- `FR-010`: A `.devcontainer/.gitignore` is created excluding any local `.env` files under `.devcontainer/`.

## Non-Functional Requirements

- `NFR-001`: Container image build completes in under 5 minutes on a cold pull on the constrained host machine.
- `NFR-002`: Final image size stays under 1.5 GB to avoid exhausting the host's available RAM during build.
- `NFR-003`: The base image tag is a stable LTS variant (e.g., `node:lts-bookworm-slim`) — not `latest` or `current`.
- `NFR-004`: The Dockerfile uses multi-step `apt-get` in one `RUN` layer to minimize layer count and image bloat.

## Observability Requirements

- `OBS-001`: The `postCreateCommand` outputs a success message confirming `pnpm install` completed — e.g., `echo "devcontainer ready"` appended after `pnpm install`.
- `OBS-002`: Docker build logs must not contain any warning about credentials or secrets being passed as `ARG` or `ENV`.

## Acceptance Criteria

- `AC-001`: **Given** a developer runs `docker compose build devcontainer`, **When** the build completes, **Then** it exits 0 and the image is listed by `docker image ls`.
- `AC-002`: **Given** the devcontainer is running, **When** the developer runs `node --version` in the terminal, **Then** it outputs an LTS version (v20.x or v22.x).
- `AC-003`: **Given** the devcontainer is running, **When** the developer runs `pnpm test`, **Then** the vitest and cucumber suites pass without missing-module or permission errors.
- `AC-004`: **Given** the devcontainer is running, **When** `pnpm --version` is run, **Then** it returns a pnpm version string confirming it is globally available.
- `AC-005`: **Given** the Dockerfile is built, **When** `docker inspect <image>` is run, **Then** no env var contains an API key, password, or credential.
- `AC-006`: **Given** a developer opens the devcontainer in VS Code, **When** the post-create command completes, **Then** the terminal opens in zsh with the `zsh-autosuggestions` plugin active.

## Required Tests

### Unit Tests

Not applicable — this task produces infrastructure files (Dockerfile, docker-compose.yml, devcontainer.json), not domain logic with isolated testable units.

### Integration Tests

- `IT-001`: **Scenario**: Container builds and project toolchain runs  
  **Given** the Dockerfile and docker-compose.yml are in place  
  **When** `docker compose build devcontainer && docker compose run --rm devcontainer pnpm install && docker compose run --rm devcontainer pnpm test`  
  **Then** the build exits 0, `pnpm install` installs all dependencies, and `pnpm test` passes  
  Covers `FR-001`, `FR-007`, `AC-003`.

### Smoke Tests

- `SMK-001`: **Scenario**: Node.js is available at container start  
  **Given** the devcontainer is running  
  **When** `node --version` is executed  
  **Then** it returns an LTS version string  
  Covers `AC-002`.

- `SMK-002`: **Scenario**: pnpm is globally available  
  **Given** the devcontainer is running  
  **When** `pnpm --version` is executed  
  **Then** it returns a version string and exits 0  
  Covers `FR-003`, `AC-004`.

- `SMK-003`: **Scenario**: Zsh is the default shell  
  **Given** the devcontainer is running  
  **When** `echo $SHELL` is executed  
  **Then** it returns a path containing `zsh`  
  Covers `FR-005`, `AC-006`.

### End-to-End Tests

Not applicable — no complete user journey in the application changes; this task only adds developer tooling.

### Regression Tests

Not applicable — no known previous defect related to this task.

### Performance Tests

- `PT-001`: Build the image from scratch and confirm total build time is under 5 minutes on the constrained host. Covers `NFR-001`.
- `PT-002`: Run `docker image ls` after build and confirm image size is under 1.5 GB. Covers `NFR-002`.

### Security Tests

- `ST-001`: Run `docker inspect <image>` and confirm no env var contains an API key, secret, or credential. Covers `FR-009`, `AC-005`.
- `ST-002`: Run `docker history <image>` and confirm no layer's command contains a hardcoded secret or credential. Covers `FR-009`.

### Usability Tests

Not applicable — this task produces infrastructure files, not user-facing UI.

### Observability Tests

Not applicable — no application-level logs, metrics, or traces are introduced by this task.

## Definition of Done

- `.devcontainer/Dockerfile`, `.devcontainer/devcontainer.json`, and `docker-compose.yml` exist at the required paths.
- pnpm is globally available in the container and `pnpm install && pnpm test` passes without manual setup.
- ADR `docs/adrs/001-devcontainer-base-image.md` and ADR `docs/adrs/002-devcontainer-user-context.md` are updated from `Proposed` to `Accepted`.
- `IT-001`, `SMK-001`, `SMK-002`, `SMK-003`, `ST-001`, `ST-002`, `PT-001`, and `PT-002` all pass.
- No secret or credential appears in any Docker image layer.
