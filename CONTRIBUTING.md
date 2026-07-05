# Contributing to @chessviewer-org/chess-viewer

Thanks for contributing! This is an npm utility package — all contributions should keep the library **zero-dependency**, **Node.js + browser compatible**, and **fully typed**.

---

## Scope

This package exports pure TypeScript utilities. A contribution is in scope if it:

- Fixes a bug in an existing export
- Adds a new chess-related utility that has no runtime dependencies
- Improves TypeScript types or JSDoc
- Adds or improves tests
- Fixes documentation

A contribution is **out of scope** if it:

- Adds a runtime dependency (`dependencies` in package.json)
- Requires a DOM, `window`, `document`, or browser-only API
- Adds React/Vue/Svelte components (those belong in a separate package)

---

## Setup

```bash
git clone https://github.com/chessviewer-org/chess-viewer-utils.git
cd chess-viewer-utils
npm install
npm test        # 107 tests should pass
npm run build   # dist/ should build clean
```

Requirements: **Node.js ≥ 18**.

---

## Making changes

### Branch naming

```
feat/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

### Before every commit

```bash
npm run typecheck   # no TypeScript errors
npm test            # all tests pass
npm run build       # dist/ builds cleanly
```

### Commit message format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

| Type | When to use |
|------|-------------|
| `feat` | New export or option |
| `fix` | Bug fix |
| `perf` | Speed or size improvement |
| `refactor` | Restructure with no behavior change |
| `docs` | README, CHANGELOG, JSDoc only |
| `test` | New or updated tests |
| `chore` | Build, deps, CI |

Examples:

```
feat(svg): add highlightSquares option to generateDiagram
fix(fen): correct parseFEN for FEN strings with extra whitespace
docs: add squareToIndices example to README
test(history): add edge cases for applyFilters with dateFrom
```

Breaking changes add `!` after the type and a `BREAKING CHANGE:` footer:

```
feat(fen)!: rename parseFEN to parseFENString

BREAKING CHANGE: parseFEN is now parseFENString. Update all import sites.
```

---

## Adding a new export

1. Add the function to the appropriate `src/*.ts` file.
2. Export it from `src/index.ts`.
3. Add at least two tests in `src/index.test.ts` — one happy path, one error/edge case.
4. Document it in `README.md` under the relevant API section.
5. Run `npm run typecheck && npm test && npm run build`.

### Rules for new exports

- **No DOM** — no `document`, `window`, `HTMLElement`, `Blob` (unless in `dpi.ts` which already exists for that purpose).
- **No runtime deps** — the package has zero runtime dependencies; keep it that way.
- **TypeScript strict** — no `any`, no `!` non-null assertions, no `@ts-ignore`.
- **Pure functions** — prefer pure functions over stateful modules.

---

## Opening a pull request

1. Fork the repo and create a branch: `feat/<name>`
2. Make your changes and run `npm test && npm run build`
3. Open a PR against `main` with a Conventional Commit title
4. Fill in the PR template
5. CI runs automatically — fix anything that fails

PRs are merged with **squash merge**. Your commits become one clean commit on `main`.

---

## Good first issues

Issues labeled [`good first issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) are a great starting point — they're well-scoped and won't require deep context.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Be kind and constructive.
