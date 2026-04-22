# persona

Build a typed Profile of your coding preferences from real session history, and emit it to `CLAUDE.md`.

## Install

    npm install -g persona
    persona init

## Quick start

    persona init                 # creates ~/.persona with empty overrides
    export ANTHROPIC_API_KEY=...
    persona rebuild --yes        # ingest sessions → build profile
    persona emit                 # write CLAUDE.md managed fence

## Commands

- `persona init`       — create ~/.persona or <project>/.persona
- `persona rebuild`    — ingest → dossier → synthesize → profile
- `persona emit`       — render Profile into CLAUDE.md
- `persona edit`       — print path to overrides.yaml for manual editing
- `persona diff`       — show diff vs last accepted profile
- `persona rollback`   — restore a previous profile
- `persona status`     — show scope, paths, last rebuild
- `persona dossier`    — print the stored dossier

Run `persona <command> --help` for flags.

## What it does

`persona` reads your Claude Code JSONL sessions, git log, and optional Helix sessions
from the last 90 days, groups observations by theme (communication style, error handling,
abstractions, etc.), and asks an LLM to turn the grouped evidence into a typed Profile of
your actual preferences. The Profile is YAML you can edit; the `CLAUDE.md` fence is a
deterministic render.

See [`docs/specs/2026-04-18-persona-v1-design.md`](docs/specs/2026-04-18-persona-v1-design.md) for design notes.
