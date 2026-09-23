# Ship config — Open Diff in Linear

## Linear

- **Team**: **Personal** (key `KIAN`, id `aad7fc92-e8c2-46c6-8aeb-16f7f139b70a`). All work for this extension lives under the **Open Diff in Linear** project.
- **API key**: `.linear-api-key` (gitignored, scoped to the Personal team), wired into the Linear MCP by `opencode.jsonc`.
- **State mapping** (canonical → workspace): Icebox → *unmapped* (use Backlog), Backlog → Backlog, Todo → Todo, In Progress → In Progress, In Review → In Review, Addressing Review → *unmapped*, Done → Done, Canceled → Canceled.
- **Lifecycle label group**: none — use the existing `blocked` label.

## Toolchain

Planned stack (the scaffold slice establishes the exact commands; update this section when it lands):

- Package manager: **bun** exclusively (never npm/yarn/pnpm/npx).
- Framework: WXT + TypeScript + React.
- Lint/format: Biome.
- Typecheck: `tsc --noEmit` via a package script.
- Build: `wxt build`; store zip: `wxt zip`.
- Test: Vitest with WXT's fake browser (`wxt/testing/fake-browser`, `wxt/testing/vitest-plugin`).
- No DB/migrations.

## Stacking

- Tool: **gh-stack** (`gh stack`, GitHub CLI extension). Never `gt` on this repo.
- Trunk: `master`.

## Reference repositories

None.

## Environment notes

- Worktrees via worktrunk (`wt`). `.config/wt.toml` `[pre-start]` copies gitignored env files and `.linear-api-key` (whitelisted in `.worktreeinclude`) and runs `bun install`.
- Executors must not load the unpacked extension into a real browser profile or touch the user's Chrome profile; verification is unit tests + build.
