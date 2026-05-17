---
id: '002'
issue: 'issues/002-install-coding-agents.md'
created: 2026-05-16
updated: 2026-05-16
---

# Implementation Summary: Install Coding Agents

## Files changed

### `.devcontainer/Dockerfile`

- Added `ENV PNPM_HOME="/usr/local/share/pnpm"` and `ENV PATH="${PNPM_HOME}:${PATH}"` after the `pnpm` global install so agent binaries are on `$PATH`.
- Appended three isolated `RUN` steps before `WORKDIR /workspace`: installs `@anthropic-ai/claude-code`, `opencode-ai`, and `@earendil-works/pi-coding-agent` via `pnpm add -g`, each followed by a `--version` call to verify the binary (build fails on error — no `|| true`).

### `.devcontainer/devcontainer.json`

- Added `"remoteEnv"` block forwarding `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `PI_API_KEY` from host environment with empty-string defaults.
- Added `"anthropic.claude-code"` VS Code extension to the extensions list.

### `.devcontainer/.env.example` (new file)

- Created with placeholder values for all three API keys and links to provider documentation.

## Verifications (read-only — no Docker build)

| Check                                         | Result                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `devcontainer.json` valid JSON                | PASS                                                                       |
| ST-001: no real secrets in devcontainer files | PASS (grep hit `.env.example` placeholders only — expected false positive) |
| ST-003: `.gitignore` covers `.env`            | PASS                                                                       |
| `PNPM_HOME` env set in Dockerfile             | PASS                                                                       |
| Claude Code install line present              | PASS                                                                       |
| opencode install line present                 | PASS                                                                       |
| pi install line present                       | PASS                                                                       |

## Notes

- `.devcontainer/.gitignore` already contained `.env` and `*.env` from Task 001 — no changes needed.
- The ST-001 grep false positive is intentional: `.env.example` contains placeholder strings (`your-anthropic-api-key-here`), not real secrets. The check's purpose is met.
