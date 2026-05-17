---
id: '002'
created: 2026-05-16
updated: 2026-05-16
status: active
---

# Task: Install Claude Code, opencode, and pi.dev coding agents in devcontainer

## Priority

P1 — Depends on Task 001 (the container must build and run first). Cannot install global pnpm tools into a non-existent image layer.

## Dependencies

- Depends on Task `issues/001-scaffold-devcontainer.md` — the Dockerfile and docker-compose.yml must exist and build successfully.
- Depends on ADR `docs/adrs/001-devcontainer-base-image.md` — global `pnpm add -g` behaviour differs by user context and base image.
- Depends on ADR `docs/adrs/002-devcontainer-user-context.md` — non-root user requires a custom pnpm store prefix or sudo for global installs.
- No external system dependency beyond Docker Hub and the public npm registry.

## Assignability

**AFK** — all package names, install commands, and API key env vars are confirmed. Requirements and acceptance criteria are fully specified. No irreversible architectural decisions remain open beyond the ADRs already resolved in Task 001.

## Context

With the devcontainer scaffold in place (Task 001), this task extends the Dockerfile to install three AI coding agent CLIs that developers will use from the container terminal. pnpm (installed in Task 001) is used for all global installs.

1. **Claude Code** (`@anthropic-ai/claude-code`) — Anthropic's official CLI for Claude. Installed via `pnpm add -g @anthropic-ai/claude-code`. Binary: `claude`. Requires `ANTHROPIC_API_KEY` at runtime.
2. **opencode** (`opencode-ai`) — an open-source AI coding agent (opencode.ai). Installed via `pnpm add -g opencode-ai`. Binary: `opencode`. Requires `OPENAI_API_KEY` or provider-specific key at runtime.
3. **pi.dev agent** (`@earendil-works/pi-coding-agent`) — the coding agent from pi.dev. Installed via `pnpm add -g @earendil-works/pi-coding-agent`. Binary: `pi`. Requires the pi.dev API key at runtime.

No API key or credential may be baked into any Docker image layer. All keys are injected at container runtime via environment variables forwarded from the host. A `.devcontainer/.env.example` documents the required vars.

## Use Cases

- **Feature**: Coding agent availability inside devcontainer
- **Scenario**: Developer uses Claude Code inside the container
- **Given** the devcontainer is running with `ANTHROPIC_API_KEY` set in the host environment
- **When** the developer types `claude` in the container terminal
- **Then** the Claude Code CLI starts and is ready to accept prompts

---

- **Feature**: Coding agent availability inside devcontainer
- **Scenario**: Developer uses opencode inside the container
- **Given** the devcontainer is running with the opencode API key set in the host environment
- **When** the developer types `opencode` in the container terminal
- **Then** the opencode CLI starts and is ready to accept prompts

---

- **Feature**: Coding agent availability inside devcontainer
- **Scenario**: Developer uses pi.dev agent inside the container
- **Given** the devcontainer is running with the pi.dev API key set in the host environment
- **When** the developer types `pi` in the container terminal
- **Then** the pi.dev agent starts and is ready to accept prompts

## Definition of Ready

- Task `issues/001-scaffold-devcontainer.md` is complete: Dockerfile builds, pnpm is globally available, and `pnpm test` passes inside the container.
- ADR `docs/adrs/002-devcontainer-user-context.md` is `Accepted` — the user context decision determines whether global `pnpm add -g` needs a store prefix or sudo.
- Package names and install commands are confirmed: `@anthropic-ai/claude-code`, `opencode-ai`, `@earendil-works/pi-coding-agent`.

## Functional Requirements

- `FR-001`: The Dockerfile installs Claude Code via `pnpm add -g @anthropic-ai/claude-code` as a dedicated `RUN` step, after pnpm is confirmed available from Task 001's image layer.
- `FR-002`: The Dockerfile installs opencode via `pnpm add -g opencode-ai` as a dedicated `RUN` step.
- `FR-003`: The Dockerfile installs the pi.dev agent via `pnpm add -g @earendil-works/pi-coding-agent` as a dedicated `RUN` step.
- `FR-004`: The `.devcontainer/devcontainer.json` forwards `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (opencode), and the pi.dev API key env var from the host environment using the `containerEnv` or `remoteEnv` mechanism — no values are hardcoded.
- `FR-005`: A `.devcontainer/.env.example` file lists all required env vars with placeholder values and one-line descriptions of where to obtain each key.
- `FR-006`: The `.devcontainer/.gitignore` (created in Task 001) excludes `.env` to prevent accidental secret commits.
- `FR-007`: Each agent install step is isolated in its own `RUN` layer so a failed install does not silently corrupt other layers.
- `FR-008`: The `devcontainer.json` adds relevant VS Code extensions for each agent if any official extensions exist.

## Non-Functional Requirements

- `NFR-001`: No API key, token, or credential is present in any Docker image layer at any point (not even as a `--build-arg`).
- `NFR-002`: Total image size after agent installation stays under 1.5 GB (same budget as Task 001).
- `NFR-003`: Each agent binary is available on `$PATH` without any additional shell configuration by the developer.

## Observability Requirements

- `OBS-001`: The Dockerfile `RUN` steps for each agent installation must not suppress errors (no `|| true` patterns); a failed install must fail the build.
- `OBS-002`: Docker build logs must confirm each agent version was installed by running `<agent> --version` (or equivalent) at the end of each install step.

## Acceptance Criteria

- `AC-001`: **Given** the devcontainer is built and running, **When** `claude --version` is run in the terminal, **Then** it returns a version string without error.
- `AC-002`: **Given** the devcontainer is built and running, **When** `opencode --version` is run in the terminal, **Then** it returns a version string without error.
- `AC-003`: **Given** the devcontainer is built and running, **When** `pi --version` is run in the terminal, **Then** it returns a version string without error.
- `AC-004`: **Given** `ANTHROPIC_API_KEY` is set in the host environment, **When** the devcontainer starts, **Then** `echo $ANTHROPIC_API_KEY` inside the container returns the key value (not empty).
- `AC-005`: **Given** no API key is set in the host, **When** a developer tries to use an agent CLI, **Then** the CLI reports a missing-key error — not a crash or silent failure.
- `AC-006`: **Given** the Dockerfile is inspected with `docker inspect` and `docker history`, **When** all layers are examined, **Then** no layer contains an API key or credential value.

## Required Tests

### Unit Tests

Not applicable — this task installs pre-built CLI binaries; there is no domain logic with isolated testable units.

### Integration Tests

Not applicable — agent functionality (calling external LLM APIs) requires live API keys and is outside the scope of container build verification.

### Smoke Tests

- `SMK-001`: **Scenario**: Claude Code CLI is available  
  **Given** the devcontainer is running  
  **When** `claude --version` is executed  
  **Then** it returns a version string and exits 0  
  Covers `FR-001`, `AC-001`.

- `SMK-002`: **Scenario**: opencode CLI is available  
  **Given** the devcontainer is running  
  **When** `opencode --version` is executed  
  **Then** it returns a version string and exits 0  
  Covers `FR-002`, `AC-002`.

- `SMK-003`: **Scenario**: pi.dev agent CLI is available  
  **Given** the devcontainer is running  
  **When** `pi --version` is executed  
  **Then** it returns a version string and exits 0  
  Covers `FR-003`, `AC-003`.

- `SMK-004`: **Scenario**: ANTHROPIC_API_KEY is forwarded into the container  
  **Given** `ANTHROPIC_API_KEY=test-value` is set in the host environment  
  **When** the devcontainer starts and `echo $ANTHROPIC_API_KEY` is run  
  **Then** it outputs `test-value`  
  Covers `FR-004`, `AC-004`.

### End-to-End Tests

Not applicable — no complete user journey in the application changes; this task only adds developer tooling.

### Regression Tests

Not applicable — no known previous defect related to this task.

### Performance Tests

- `PT-001`: Build the image from scratch (including agent installs) and confirm total size stays under 1.5 GB. Covers `NFR-002`.

### Security Tests

- `ST-001`: Run `docker inspect <image>` and confirm no env var contains an API key or credential. Covers `FR-001`–`FR-003`, `AC-006`.
- `ST-002`: Run `docker history <image>` and confirm no layer's command contains an API key or credential. Covers `NFR-001`, `AC-006`.
- `ST-003`: Confirm `.devcontainer/.gitignore` excludes `.env` before committing. Covers `FR-006`.

### Usability Tests

Not applicable — this task produces Dockerfile changes and config files, not user-facing UI.

### Observability Tests

Not applicable — no application-level logs, metrics, or traces are introduced by this task.

## Definition of Done

- Claude Code, opencode, and pi.dev CLIs are installed globally in the image and available on `$PATH`.
- `.devcontainer/devcontainer.json` forwards all required API key env vars from the host.
- `.devcontainer/.env.example` documents all required keys with placeholder values.
- `SMK-001` through `SMK-004`, `ST-001` through `ST-003`, and `PT-001` all pass.
- No secret or credential appears in any Docker image layer.
