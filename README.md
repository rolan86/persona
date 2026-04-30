# persona

Build a typed profile of your coding preferences from real session history, and emit it into a managed fence in `CLAUDE.md`.

## Why

- `CLAUDE.md` drifts. You wrote it once, your habits changed, and now it lies.
- Hand-authored preferences are aspirational. Most people write the version of themselves they wish they were, not the version that shows up in their sessions.
- Per-project preferences are tedious to maintain by hand.
- Every assistant that reads `CLAUDE.md` gets a stale picture of you, so it keeps making the same wrong defaults.
- The evidence already exists. Your Claude Code JSONL transcripts, your git log, and your Helix sessions describe how you actually work.

## How it works

```
ingest          dossier            synthesize        emit
JSONL    -->    grouped       -->  Profile     -->   CLAUDE.md
git log         themes by           (typed YAML)     managed fence
Helix           evidence
```

1. **ingest** — read recent observations from your Claude Code JSONL transcripts, your git log, and (optionally) Helix sessions, scoped to a time window.
2. **dossier** — group those observations by theme (communication style, error handling, testing, abstractions, etc.) into a single JSON dossier.
3. **synthesize** — ask an LLM to convert the grouped evidence into typed `preferences`, `conventions`, and `rationales`, each with a confidence score and back-references to the evidence.
4. **emit** — render the merged Profile (generated + your overrides) into a `<!-- PERSONA:START -->` ... `<!-- PERSONA:END -->` fence in `CLAUDE.md`. The rest of the file is left alone.

## Install

Until persona is published to npm, install from a clone:

```sh
git clone https://github.com/rolan86/persona.git
cd persona
npm install
npm run build
npm link
```

After publish:

```sh
npm install -g persona
```

## Requirements

- Node.js 20 or newer.
- The `claude` CLI on your `PATH` (Claude Code, free for personal use). Persona shells out to it for synthesis by default, so no `ANTHROPIC_API_KEY` is required.
- `git`, if you want the git-log ingest source.
- A Helix sessions directory, if you want the Helix ingest source. Defaults to `~/Desktop/Projects/helix/data/sessions`; override with `PERSONA_HELIX_DIR`.

## Quick start

```sh
persona init                  # creates .persona/ in cwd (or ~/.persona for --scope global)
persona rebuild --yes         # ingest -> dossier -> synthesize -> write profile.generated.yaml
persona emit                  # render the merged profile into CLAUDE.md
```

After `init` you have `.persona/profile.overrides.yaml` (empty seed) and a `.gitignore`.
After `rebuild --yes` you have `.persona/profile.generated.yaml` and `.persona/dossier.json`.
After `emit` your `CLAUDE.md` contains a managed fence with the rendered profile.

## Commands

| Command | What it does |
|---|---|
| `persona init` | Create `.persona/` with an empty overrides file. |
| `persona status` | Print scope, paths, and last rebuild time. |
| `persona rebuild` | Ingest, build a dossier, synthesize a profile. Two-step accept: re-run with `--yes` to write. |
| `persona dossier` | Print the stored dossier as JSON. |
| `persona emit` | Render the merged profile into `CLAUDE.md`. |
| `persona edit` | Print the path to `profile.overrides.yaml` so you can open it in your editor. |
| `persona diff` | Show added / removed statements vs the most recent previous profile. |
| `persona rollback` | Restore a previous profile from `.persona/previous/`. |

Run `persona <command> --help` for flags. `rebuild` accepts `--scope`, `--window`, `--no-jsonl`, `--no-git`, `--no-helix`, `-y/--yes`, `--dry-run`. `rollback` accepts `--to <substring>`.

## Configuration

Environment variables:

- `PERSONA_LLM` — synthesis backend. Default `claude-code` (shell out to the local `claude` CLI). Set to `api` to use the Anthropic API directly via `ANTHROPIC_API_KEY`.
- `PERSONA_HELIX_DIR` — override the Helix sessions directory. Defaults to `~/Desktop/Projects/helix/data/sessions`.
- `ANTHROPIC_API_KEY` — only required when `PERSONA_LLM=api`.

## What lives where

A persona scope is either global (`~/.persona`, with `CLAUDE.md` at `~/.claude/CLAUDE.md`) or project (`<project>/.persona`, with `CLAUDE.md` at the project root). Inside `.persona/`:

- `profile.generated.yaml` — the LLM-synthesized profile. Overwritten by `rebuild --yes`.
- `profile.overrides.yaml` — your hand edits. Merged on top of the generated profile at emit time.
- `dossier.json` — the grouped evidence the last synthesis ran against.
- `previous/` — rotated snapshots of `profile.generated.yaml` from previous rebuilds (most recent 5 kept). `rollback` restores from here.
- `.gitignore` — written by `init`. By default it ignores everything inside `.persona/`; `init --share` keeps `profile.overrides.yaml` tracked for shared per-project profiles.

The fence written into `CLAUDE.md` looks like:

```
<!-- PERSONA:START v1 generated=2026-04-22T... -->
... rendered profile ...
<!-- PERSONA:END -->
```

Anything outside the fence is preserved verbatim. Anything inside is replaced on every `emit`.

## Privacy

Your data stays on your machine. Ingest reads local JSONL files, local git history, and (optionally) local Helix sessions. The only network call is synthesis. With the default `claude-code` backend, synthesis goes through your existing local `claude` CLI session — persona itself uploads nothing. With `PERSONA_LLM=api`, the dossier is sent to the Anthropic API under your own key.

## FAQ

**Why a managed fence instead of replacing `CLAUDE.md`?**
Because `CLAUDE.md` is yours. You probably have hand-written sections that persona has no business touching. The fence makes the boundary explicit and lets you keep both.

**Does this work with Cursor / Aider / Cline / other tools?**
Yes. Persona writes a `CLAUDE.md` file. Anything that reads `CLAUDE.md` will see the rendered profile. There is no plugin or runtime integration.

**How often should I rebuild?**
Whenever you feel the profile is stale. Weekly or after a stretch of meaningfully different work is a reasonable cadence. The default window is 90 days.

**What if the LLM gets it wrong?**
Edit `profile.overrides.yaml` (use `persona edit` to print the path). Anything you put there overrides the generated profile at emit time.

**Can I exclude specific topics?**
Yes. Add entries under `excluded` in `profile.overrides.yaml`. Excluded statements are dropped from the rendered fence even if synthesis produces them.

**Can I see what changed between rebuilds?**
`persona diff` shows added and removed statements vs the most recent snapshot in `.persona/previous/`. `persona rollback` restores a previous profile.

## Roadmap

Post-v1 follow-ups:

- Real `$EDITOR` launch for `persona edit` instead of just printing the path.
- Second-precision snapshot timestamps in `.persona/previous/` to avoid collisions on rapid rebuilds.
- Profile-gate review without burning a synthesis call (a cheap pre-check before re-running the LLM).

## Contributing

Design notes: [`docs/specs/2026-04-18-persona-v1-design.md`](docs/specs/2026-04-18-persona-v1-design.md).
Implementation plan: [`docs/plans/2026-04-18-persona-v1.md`](docs/plans/2026-04-18-persona-v1.md).

## License

MIT. See [`LICENSE`](LICENSE).
