# ADR 002: Devcontainer user context (root vs non-root)

## Status

Accepted

## Date

2026-05-16

## Related Tasks

- `issues/001-scaffold-devcontainer.md`

## Context

The reference pattern at `references/devcontainer-sample/` runs the container as `root` (no `USER` directive). Running as root simplifies bind-mount ownership — the workspace files created by the host user are writable without `chown` steps. However, running as root inside a container is a security risk: if a dependency or tool is compromised, it has full container filesystem access.

The Dev Containers spec supports named non-root users via `remoteUser` in `devcontainer.json`. The VS Code Dev Containers extension handles UID remapping automatically when `remoteUser` is set.

## Decision

Run as root (no USER directive). Acceptable for a local development container that never runs in production.

## Options Considered

1. Run as root (no `USER` directive). `(recommended for simplicity)` — Matches the reference pattern; bind-mount files are always writable; no UID mismatch issues; acceptable risk for a local development container that never runs in production.
2. Create a named non-root user (e.g., `developer`) and set `remoteUser` in `devcontainer.json`. — More secure; Docker best practice; requires careful UID alignment with the host user to avoid bind-mount permission errors; adds Dockerfile complexity.
3. Use the `mcr.microsoft.com/devcontainers/javascript-node` feature-based image which pre-creates a `node` non-root user. — Least manual setup; Microsoft-maintained image; adds an opaque dependency on Microsoft's base images; less control over installed tools.

## Consequences

Positive (Option 1 — root):

- Simplest path; workspace files always writable.
- No UID/GID mismatch problems on Linux or macOS hosts.
- Matches the reference pattern already understood by the team.

Negative (Option 1 — root):

- Violates the principle of least privilege inside the container.
- Any rogue npm postinstall script or compromised tool has root access.

Positive (Option 2 — non-root):

- Principle of least privilege; aligns with container security best practices.

Negative (Option 2 — non-root):

- UID mismatch between host user and container user can make bind-mounted files read-only.
- Requires `--uid` alignment or `fixuid` tool; adds Dockerfile complexity.
- `npm install -g` for coding agents requires `sudo` or a custom `npm prefix` for the user.

## Validation

- Confirm that `npm ci`, `npm test`, and file creation inside `/workspace` succeed without permission errors.
- If non-root: confirm `whoami` returns the named user, not `root`.
- Confirm no image layer sets `ROOT_PASSWORD` or equivalent credentials.

## Open Questions

- Is the development team working on Linux hosts (where UID mismatch is most common) or macOS/Windows where Docker Desktop handles UID remapping transparently?
- Are there CI pipelines that reuse this devcontainer image? If yes, non-root is strongly preferred.
