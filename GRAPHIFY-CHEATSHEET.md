# Graphify + Obsidian Cheat Sheet (ToTravel)

Quick reference for the knowledge-graph system installed 2026-07-06.
Graphify v0.9.7 (`graphifyy` on PyPI, installed via `uv tool` with `[pdf,office,sql]` extras).

## Where everything lives

| Thing | Location |
|---|---|
| Graph data + report | `D:\ToTravel\graphify-out\` (`graph.json`, `GRAPH_REPORT.md`, `graph.html`) |
| Interactive graph | open `graphify-out\graph.html` in any browser (no server) |
| Obsidian notes (1,236) | `C:\Users\WinDows\OneDrive\Documents\Obsidian Vault\ToTravel Graph\` |
| Obsidian canvas | `ToTravel Graph\graph.canvas` (communities as visual groups) |
| Claude Code skill | `~\.claude\skills\graphify\` (user-global, all projects) |
| CLI | `graphify` on PATH (restart terminal if not found; installed in `C:\Users\WinDows\.local\bin`) |

## Daily use — ask questions instead of grepping

```powershell
graphify query "how does the booking flow work?"        # scoped subgraph answer
graphify query "what protects bookings from tampering?" # works for schema too
graphify path "PackageWizard" "save_package"            # shortest path A → B
graphify explain "useAuth()"                            # one concept, all connections
graphify explain "public.package_bookings"              # SQL tables/RPCs/triggers work
```

In **Claude Code**, just ask codebase questions normally — the project CLAUDE.md
and PreToolUse hooks make Claude query the graph first automatically.
`/graphify` also works as a slash command in any session.

> PowerShell note: type `graphify .` — a leading `/` only works inside AI assistants.

## Keeping the graph fresh

| When | Command | Cost |
|---|---|---|
| After editing code (TS/SQL) | `graphify update .` | free (AST only) |
| After every git commit / checkout | *automatic* (git hooks installed) | free |
| After editing docs (PRD, audits, .md) | `/graphify . --update` in Claude Code | small (LLM for changed docs only) |
| Refresh Obsidian notes | `graphify export obsidian --dir "C:/Users/WinDows/OneDrive/Documents/Obsidian Vault/ToTravel Graph"` | free |
| Deleted files linger in graph | add `--force` to the update/extract | free |
| Deeper frontend↔schema inference | `/graphify . --update --mode deep` in Claude Code | tokens |

Typical loop: code → commit (graph auto-rebuilds) → occasionally re-export Obsidian.

## Obsidian workflow

- Open the **vault root** (`Obsidian Vault`), not the subfolder — your own notes and the
  generated `ToTravel Graph\` folder share one graph view, colored by 107 communities.
- Write your own notes anywhere and link into the codebase with `[[useAuth()]]`,
  `[[public.packages]]`, `[[PackageWizard]]` — backlinks connect ideas to code.
- Filter the graph view by tags: `#graphify/code`, `#graphify/document`,
  `#community/Schema__SEC_1_Agency_Update_Guard`, etc.
- **Never hand-edit generated notes** — the exporter owns them (tracked in
  `.graphify_obsidian_manifest.json`) and overwrites on re-export. Your own notes are never touched.

## Reading the output honestly

- Every edge is tagged: `EXTRACTED` (explicit in source) / `INFERRED` (derived) / `AMBIGUOUS` (uncertain).
- `graphify-out\GRAPH_REPORT.md` — god nodes, surprising connections, suggested questions.
- Known limits: TS `.from('packages')` string calls aren't auto-linked to SQL table nodes
  (separate grammars); graph reflects migration files, not the live Supabase DB
  (`graphify extract --postgres <DSN>` can introspect live, needs `postgres` extra).

## Maintenance / troubleshooting

```powershell
graphify --version                  # sanity check
uv tool upgrade graphifyy           # upgrade…
graphify install                    # …then refresh the skill (version mismatch warning)
graphify hook install               # re-run after upgrades (re-embeds interpreter path)
graphify hook status                # check git hooks
graphify uninstall                  # remove everything (--purge also deletes graphify-out)
```

- `graphify: command not found` → restart terminal, or run `uv tool update-shell`.
- Reinstalling? Keep the extras: `uv tool install --force "graphifyy[pdf,office,sql]"`
  — **without `sql`, all 33 supabase/migrations/*.sql files are silently skipped.**
- OneDrive noisy about 1,200+ small files → ignore `ToTravel Graph` folder in OneDrive settings.
- `graphify-out\` is committed (team gets the graph on pull); `cost.json`, `cache/`,
  `.graphify_python`, `.graphify_root` stay local via `.gitignore`.
