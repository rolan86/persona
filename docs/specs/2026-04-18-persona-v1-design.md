# Persona v1 Design

**Status:** Draft
**Date:** 2026-04-18
**Author:** Merryl DMello (with Claude)
**Target:** `persona-core` v1

---

## 1. Goal

Persona is a standalone CLI that captures how one developer actually works — their preferences, conventions, reasoning style, recurring guidance — and emits machine-consumable artifacts (starting with `CLAUDE.md`) that make other AI coding assistants behave like they've worked with that developer before.

v1 is scoped narrowly: ingest real coding-session evidence, synthesize a typed Profile describing the developer, and render a managed section inside `CLAUDE.md`. Everything else (skills, slash commands, agent definitions, style transfer, cross-tool rules, continuous learning) is explicitly deferred.

**Success criterion:** after running `persona rebuild && persona emit` once, a fresh Claude Code session in any project picks up preferences that previously required the user to repeat themselves across sessions.

---

## 2. Non-Goals (v1)

- Not a code-style transfer tool (no AST-level style fingerprinting — that's Category B, deferred).
- Not a cross-tool emitter for Cursor / Windsurf / Copilot (Category C, deferred).
- Not a continuous-learning daemon (Category E / `persona-evolve`, deferred).
- Not a human-facing self-report card or written style guide (Category D, explicitly rejected).
- Not coupled to Helix. Persona runs standalone; if Helix sessions are present on disk, Persona ingests them as a bonus source, but Persona has no runtime dependency on Helix.
- Not an online service. Local-only, file-based, deterministic where possible.

---

## 3. Architecture

### 3.1 Layered Design

Persona is split into two layers from day one, even though only the first ships in v1:

- **`persona-core`** (v1): ingest → dossier → synthesize → profile → emit. Batch, user-invoked.
- **`persona-evolve`** (deferred): opt-in subsystem that adds a `SessionEnd` hook and a tournament-style variant evaluator on top of `persona-core`. Not built in v1, but the core's data shapes and CLI surface are designed so `persona-evolve` can plug in without refactoring.

This split matters because the user explicitly chose "manual rebuild (option 1) with opt-in 2+3 later." The core must stay usable without the evolve layer.

### 3.2 Pipeline

```
  sources                    dossier                  profile                  artifacts
  -------                    -------                  -------                  ---------
  Claude Code JSONL  ─┐
  git log (author)    ├─►  ingest  ─►  dossier.json  ─►  synthesize  ─►  profile.generated.yaml  ─►  emit  ─►  CLAUDE.md
  Helix sessions      ─┘     (normalize)                   (LLM+facts)              │                            (managed fence)
                                                                                    │
                                                                          profile.overrides.yaml
                                                                               (user-owned)
```

**Stages:**

1. **Ingest** — read from three sources into a common `Observation` type. Each observation carries `{source, sessionId, timestamp, kind, payload}` so synthesis doesn't care where evidence came from.
2. **Dossier** — deterministic aggregation. Groups observations by theme (file-type preferences, tooling choices, reasoning patterns, recurring corrections). Produces `dossier.json` with counts, timestamps, and example snippets. No LLM involved.
3. **Synthesize** — LLM call(s) that read the dossier and produce typed `Profile` statements with confidence scores. Grounded: the LLM is only allowed to reference evidence present in the dossier.
4. **Profile** — user-reviewable YAML. Two files: `profile.generated.yaml` (rebuilt each run) + `profile.overrides.yaml` (user-owned, merged at emit-time).
5. **Emit** — deterministic template render from merged Profile → `CLAUDE.md` managed fence.

### 3.3 Sources (v1)

All three sources ingested by default. Each is independently skippable via CLI flags.

| Source | Path | Primary signal |
|---|---|---|
| Claude Code JSONL | `~/.claude/projects/*/...*.jsonl` | Conversation turns, tool use patterns, user corrections |
| git log | `git log --author=<email>` per project | Commit cadence, message style, file co-change patterns |
| Helix sessions | `<helix>/data/sessions/` (if present) | Discovery output, review notes (bonus when available) |

**Time window:** last 90 days. If fewer than 20 sessions found in that window, auto-expand to the last 500 sessions regardless of date. This protects new users and keeps old accounts from drowning in stale data.

### 3.4 Cascaded Scope

Mirrors Claude Code's native `CLAUDE.md` cascade:

- **Global Profile:** `~/.persona/profile.{generated,overrides}.yaml` → emits into `~/.claude/CLAUDE.md`.
- **Per-project Profile:** `<project>/.persona/profile.{generated,overrides}.yaml` → emits into `<project>/CLAUDE.md`.

The per-project Profile is generated only from sessions whose `cwd` falls inside that project. Project-level statements override global ones at render time.

### 3.5 Synthesis: Hybrid Facts Dossier + LLM (Approach 3)

The dossier does the quantitative work — counting, grouping, summarizing — so it's deterministic and re-runnable offline. The LLM receives the dossier (not raw sessions) and interprets it into natural-language Profile statements.

Why this shape:
- **Grounding:** LLM cannot hallucinate preferences that aren't in the dossier.
- **Cost:** one or two LLM calls per rebuild, not per session.
- **Debuggability:** dossier is inspectable (`persona dossier`); users can see exactly what evidence led to each statement.
- **Nuance:** LLM still produces natural language, so statements read like "prefers pragma-over-ceremony comments" rather than canned templates.

### 3.6 Output Coexistence

Persona writes a managed fenced section; user-written content is never touched:

```
<!-- PERSONA:START v1 generated=2026-04-18T10:23:00Z -->
... generated content ...
<!-- PERSONA:END -->
```

Emit logic:
- If fence absent: append fence at the bottom of `CLAUDE.md`.
- If fence present: replace fence contents in-place.
- If file absent: create it with fence only.
- Everything outside the fence is preserved byte-for-byte.

---

## 4. Profile Schema

Profile is YAML for human readability. Both files share the same schema; `overrides` wins on conflicts.

### 4.1 Shape

```yaml
version: 1
generated_at: 2026-04-18T10:23:00Z   # only in profile.generated.yaml
scope: global                         # or "project: <path>"

identity:
  name: Merryl DMello
  email: rolan86@gmail.com
  primary_languages: [typescript, python]
  primary_tools: [claude-code, helix]

preferences:
  - id: pref_001
    statement: "Prefers terse responses; no trailing summaries."
    confidence: 0.88
    evidence:
      - { source: claude-jsonl, count: 14, first: 2026-02-02, last: 2026-04-15 }
    tags: [communication, style]

  - id: pref_002
    statement: "Commits directly to main on personal projects like Helix; avoids branch ceremony."
    confidence: 0.72
    evidence:
      - { source: git-log, count: 43, first: 2026-01-20, last: 2026-04-17 }
    tags: [git, workflow]

conventions:
  - id: conv_001
    statement: "Tests live alongside source as *.test.ts, not in a separate tests/ tree."
    confidence: 0.81
    scope_hint: [typescript]
    evidence:
      - { source: git-log, count: 28 }

rationales:
  - id: rat_001
    statement: "Avoids abstract factories for 1-2 call sites — prefers inline construction until duplication forces extraction."
    confidence: 0.65
    evidence:
      - { source: claude-jsonl, count: 6, examples: ["session-abc: declined factory suggestion", "..."] }

excluded:   # low-confidence or user-suppressed, kept for review, NOT rendered
  - id: pref_099
    statement: "Uses 2-space indent."
    confidence: 0.34
    reason: "Below render threshold (0.5)."
```

### 4.2 Two-File Model

- `profile.generated.yaml` — rebuilt from scratch every `persona rebuild`. User should treat as read-only.
- `profile.overrides.yaml` — user-owned. Add statements, pin confidence, or suppress by id.

Merge rule: `overrides` wins when `id` matches; otherwise both sets union. This lets the user pin truth ("I actually do prefer X, stop forgetting") without fighting the generator.

### 4.3 Confidence and Rendering

- Statements with `confidence < 0.5` are moved to `excluded:` and not rendered into `CLAUDE.md`.
- User can promote an excluded statement by copying it into `overrides` with a higher confidence.
- `persona edit` opens both YAML files side-by-side for review.

### 4.4 Profile-Gate Review

After `persona rebuild`, the CLI reports what changed vs. the last accepted Profile and asks for confirmation before writing `profile.generated.yaml`. Users review YAML, not `CLAUDE.md`; `CLAUDE.md` is a deterministic render.

---

## 5. CLI Surface

Eight commands in v1. All operate on the scope of the current working directory (global if run outside a project, per-project if `<cwd>/.persona/` exists).

| Command | Purpose |
|---|---|
| `persona init` | Create `~/.persona/` (or `<project>/.persona/`); seed empty `overrides.yaml`; no ingest. |
| `persona rebuild` | Run ingest → dossier → synthesize → write `profile.generated.yaml` (after profile-gate review). |
| `persona emit` | Render merged Profile into `CLAUDE.md` managed fence. |
| `persona edit` | Open `profile.overrides.yaml` in `$EDITOR`. |
| `persona diff` | Show diff between current `profile.generated.yaml` and previous accepted version. |
| `persona rollback [--to <timestamp>]` | Restore a previous Profile from `previous/`. |
| `persona status` | Print scope, last rebuild time, source counts, render target path. |
| `persona dossier` | Print or export the dossier for inspection (`--json`, `--pretty`). |

**Flags (global):**
- `--scope global|project` — force scope instead of auto-detect.
- `--no-jsonl` / `--no-git` / `--no-helix` — skip a source.
- `--window 90d` / `--window 500s` — override ingest window (days or sessions).
- `--dry-run` — for `rebuild` and `emit`, show what would change without writing.

---

## 6. File Layout

### 6.1 Source Repository (`~/Desktop/Projects/persona/`)

```
persona/
├── docs/
│   └── specs/
│       └── 2026-04-18-persona-v1-design.md
├── src/
│   ├── cli/           # one file per command
│   ├── ingest/        # jsonl.ts, git.ts, helix.ts, types.ts
│   ├── dossier/       # aggregate.ts, group.ts, types.ts
│   ├── synthesize/    # llm.ts, prompts.ts, types.ts
│   ├── profile/       # schema.ts, merge.ts, io.ts
│   ├── emit/          # claudemd.ts, fence.ts
│   └── index.ts
├── test/
│   ├── fixtures/      # sample JSONL, git log snapshots, Helix sessions
│   └── snapshots/     # expected CLAUDE.md renders
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

### 6.2 On-Disk Storage (`~/.persona/` and `<project>/.persona/`)

```
~/.persona/
├── profile.generated.yaml
├── profile.overrides.yaml
├── dossier.json
├── previous/
│   ├── profile.20260418-1023.yaml
│   ├── profile.20260412-0844.yaml
│   └── ...             # last 5 kept, older deleted on rebuild
└── state.json          # last rebuild timestamp, source counts, etc.
```

### 6.3 Tech Stack

- **Language:** TypeScript
- **Runtime:** Node 20+
- **Packaging:** single CLI binary via `tsx` or `esbuild` bundle; published to npm as `persona` (subject to name availability) or installed via `npm link` during dev.
- **Dependencies:** minimal. YAML parser, simple-git (or shell out), Anthropic SDK for synthesis. No framework.

---

## 7. Testing Strategy

- **Unit tests** for each module with fixtures in `test/fixtures/`:
  - Ingest: parse a canned JSONL file, produce expected `Observation[]`.
  - Dossier: feed known observations, assert groupings and counts.
  - Profile merge: generated + overrides → expected merged Profile.
  - Emit: merged Profile → exact `CLAUDE.md` byte output (snapshot).
- **Integration tests** that run the full pipeline on a fixture corpus end-to-end.
- **Snapshot tests** for CLAUDE.md renders; one snapshot per fixture Profile.
- **Mocked LLM calls** in synthesize tests — no network in the test suite. A separate, manual `npm run synth:live` exercises the real Anthropic API against a small fixture and is not run in CI.

---

## 8. v1 Scope Boundaries

**In scope:**
- Full pipeline (ingest → dossier → synthesize → profile → emit).
- All three sources (Claude Code JSONL, git log, Helix sessions if present).
- All eight CLI commands.
- Global and per-project cascaded scope.
- Two-file Profile model.
- Managed-fence emission to `CLAUDE.md`.
- Profile-gate review, rollback, confidence filtering.

**Deferred (not built in v1, but won't be blocked by v1's shape):**
- Category B: code-style transfer / AST fingerprinting.
- Category C: Cursor / Windsurf / Copilot rule emitters.
- Category E: `persona-evolve` (SessionEnd hook, tournament evaluation, fine-tuning corpus, team clones).
- Additional Category A emitters (skills, slash commands, agent definitions).

---

## 9. Open Questions

These are called out for the implementation plan to resolve, not for the design to answer now.

1. **LLM model choice for synthesis.** Start with `claude-opus-4-7` for quality; consider Haiku for faster iteration during dossier review. Decide in the plan.
2. **Dossier size cap.** For heavy users, the dossier could exceed a reasonable synthesis context. Likely solution: cap at top-N observations per group, but N is TBD.
3. **`.persona/` in git?** Per-project profiles could be committed (shared with collaborators) or gitignored (personal). Default is probably gitignore, with a `persona init --share` opt-in. Confirm in the plan.
4. **Windows / WSL path handling.** v1 targets macOS/Linux; Windows support is explicitly out of scope unless trivially free.

---

## 10. Risks

- **LLM drift:** synthesis output format could drift between model versions. Mitigation: schema validation on LLM output; fail loud on schema violations.
- **Slop statements:** the LLM may produce confident-sounding preferences that don't match reality. Mitigation: profile-gate review is mandatory on first run and on every `rebuild`; `excluded:` bucket keeps low-confidence items visible.
- **Source skew:** if one source dominates (e.g., thousands of Claude Code turns vs. a few git commits), the Profile could reflect conversation style more than coding style. Mitigation: dossier weights observations per-source before synthesis.
- **Stale Profile:** a Profile generated 6 months ago will misrepresent current preferences. Mitigation: `persona status` surfaces age; consider nagging in `persona-evolve`, not in core.

---

## 11. Future-Proofing for `persona-evolve`

The v1 core is designed so the evolve layer can bolt on without refactoring:

- Profile is already versioned (`version: 1`), so evolve can add `version: 2` fields without breaking v1.
- Dossier is a stable JSON artifact, so evolve's SessionEnd hook can append observations between rebuilds.
- `previous/` history gives evolve a baseline for tournament comparisons.
- CLI is noun-verb, so `persona evolve start` fits the pattern.

No code stubs for evolve land in v1 — just shape compatibility.
