# ADR 001: Devcontainer base image selection

## Status

Accepted

## Date

2026-05-16

## Related Tasks

- `issues/001-scaffold-devcontainer.md`

## Context

The repo is a Node.js / Vite / TypeScript / Web Components project (`portable-bi`). The devcontainer needs Node.js LTS available at container start so the project toolchain (vitest, cucumber, stryker, knip) works without an extra install step. The reference pattern at `references/devcontainer-sample/` uses `debian:bookworm-slim` and installs tools as static binaries. Three options exist for providing Node.js in the devcontainer image.

The host machine is memory-constrained (7 GB RAM, 1.6 GB free). Image size and build time matter.

## Decision

Use `node:lts-bookworm-slim` as the base image.

## Options Considered

1. Use `node:lts-bookworm-slim` as the base image. `(recommended)` — Node.js LTS ships pre-installed; image is minimal (Debian Slim); security patches follow the upstream Node.js Docker image release cycle; no manual version pinning needed.
2. Use `debian:bookworm-slim` and install Node.js via NodeSource apt repository. — Matches the reference pattern exactly; requires an extra apt step and version management; slightly more control over the Node.js minor version.
3. Use `node:lts-alpine` as the base image. — Smallest footprint (~50 MB base vs ~250 MB Debian Slim); `musl` libc may cause compatibility issues with native Node.js addons (DuckDB WASM build tools, Stryker's native binaries); `apk` package set differs from Debian.

## Consequences

Positive (Option 1 — recommended):

- Node.js LTS is ready without extra Dockerfile steps.
- Debian Slim base provides `apt` compatibility with the reference pattern's tool installs (curl, git, zsh, make).
- Security image updates are automated through Docker Hub's Node.js official image.

Negative (Option 1):

- Node.js version is pinned to the LTS tag, not a specific patch; reproducible builds require digest pinning.
- Image is larger than Alpine (~250 MB base vs ~50 MB).

Negative (Option 3 — Alpine):

- DuckDB WASM and Stryker use prebuilt native binaries that assume glibc; musl incompatibility is a known risk.

## Validation

- Build the image and run `node --version` inside the container to confirm Node.js LTS is present.
- Run `npm ci && npm test` inside the container to confirm the project toolchain works end-to-end.
- Run `docker image ls` and confirm image size stays under 1.5 GB after all tools are installed.

## Open Questions

- Should the Node.js version be pinned by digest (fully reproducible) or by `lts` tag (always latest LTS)?
- Should the image be rebuilt on a schedule (e.g., weekly) to pick up OS security patches?
