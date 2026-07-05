# Copilot / AI agent instructions

These notes help AI assistants make changes that fit this project.

## What this is

`@chessviewer-org/chess-viewer` is a **dependency-free chess diagram toolkit**
that runs in both Node.js and the browser. It parses and edits FEN positions,
renders self-contained SVG diagrams, and provides color, theme, image, and DPI
utilities. It powers [chessvision.org](https://chessvision.org) but ships as a
standalone library.

## Hard constraints

- **Zero runtime dependencies.** Never add a package to `dependencies`. Anything
  needed at runtime must be implemented in-tree.
- **No DOM, no Node-only globals in the core.** Code must run unchanged in the
  browser and in Node. Use `Uint8Array` / `ArrayBuffer` / `Blob`, not `Buffer`,
  `fs`, `document`, or `window`. (Examples and tests may use Node APIs.)
- **Pure functions by default.** Board helpers must not mutate their inputs —
  return new values. See `src/board.ts` for the established pattern.
- **Full public types.** Every export in `src/index.ts` must have explicit
  parameter and return types. Avoid `any`; narrow `unknown`.

## Project layout

- `src/*.ts` — one module per concern (`fen.ts`, `fen-record.ts`, `board.ts`,
  `svg.ts`, `pieces.ts`, `colors.ts`, `constants.ts`, `themes.ts`,
  `coordinates.ts`, `history.ts`, `image.ts`, `dpi.ts`, `validation.ts`).
- `src/index.ts` — the single public entry point; re-exports everything.
- `src/index.test.ts` — the entire test suite (Node.js native test runner).
- `examples/` — runnable `tsx` examples; excluded from the published package.

## Conventions

- **Adding a feature:** implement in the relevant module, export it from
  `src/index.ts`, add tests to `src/index.test.ts`, and update `README.md` and
  `CHANGELOG.md` (under `## [Unreleased]`).
- **Backward compatibility:** new options must be optional with sensible
  defaults. A behavior change that breaks callers requires a `BREAKING CHANGE:`
  commit footer (triggers a major release).
- **Commits:** Conventional Commits drive releases via semantic-release —
  `feat:` → minor, `fix:`/`perf:`/`refactor:` → patch, `BREAKING CHANGE:` →
  major. `docs:`/`chore:`/`test:` do not release.
- **Square references:** `'e4'` algebraic or `[row, col]` indices where `row 0`
  is rank 8. Use `squareToIndices` / `indicesToSquare`.

## Before opening a PR

```bash
npm run typecheck   # tsc --noEmit, must be clean
npm test            # all tests must pass
npm run build       # dual ESM + CJS + d.ts must succeed
```
