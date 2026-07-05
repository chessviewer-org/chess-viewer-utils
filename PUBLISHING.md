# Publishing Guide

This document describes how releases of `@chessviewer-org/chess-viewer` are
produced and published to the npm registry.

## Automated publishing (recommended)

Releases are published automatically by GitHub Actions using
[npm Trusted Publishers (OpenID Connect)](https://docs.npmjs.com/trusted-publishers).
No long-lived `NPM_TOKEN` is required — authentication is brokered by GitHub
Actions OIDC, and packages are published with provenance attestation.

### 1. Configure the Trusted Publisher on npm (one-time)

On [npmjs.com](https://www.npmjs.com/package/@chessviewer-org/chess-viewer/access),
open the package and go to **Settings → Trusted Publisher → Add publisher**:

| Field                | Value                  |
| -------------------- | ---------------------- |
| Publisher            | `GitHub Actions`       |
| Organization or user | `chessviewer-org`      |
| Repository           | `chess-viewer-utils`   |
| Workflow filename    | `release.yml`          |
| Environment name     | *(leave empty)*        |
| Allowed actions      | `publish` (and optionally `stage publish`) |

### 2. Workflow requirements (already configured)

The `release.yml` workflow is set up so that:

- It declares `permissions: id-token: write`, required for the OIDC token.
- It upgrades npm to `>= 11.5.1` in CI, which is required for OIDC publishing.
- `.npmrc` contains **no auth token line** — only the registry and
  `provenance=true`.

### 3. Cut a release

Go to **Actions → Release → Run workflow → Run**.

The workflow then automatically:

1. Runs the test suite.
2. Builds the distributable bundles.
3. Computes the next version from commit messages
   (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major).
4. Updates `CHANGELOG.md`.
5. Bumps the version in `package.json`.
6. Publishes to npm over OIDC, with provenance.
7. Creates the corresponding GitHub Release.

---

## Manual publishing (fallback)

Manual publishing should only be used if the automated workflow is unavailable.

### 1. Authenticate with npm

```bash
npm login
npm whoami   # verify you are logged in
```

### 2. Verify the npm organization

Scoped packages require the `chessviewer-org` organization to exist and for
your account to have publish access to it. It can be created at
[npmjs.com/org/create](https://www.npmjs.com/org/create) if it does not already
exist.

### 3. Publish

```bash
npm run build     # refresh dist/
npm test          # all tests must pass
npm publish --access public
```

Scoped packages are private by default, so `--access public` is required for a
public release.

> **Note:** The repository's `.npmrc` enables `provenance=true`, which only
> works in a CI/OIDC context. For a local manual publish you may need to pass
> `--provenance=false`.

---

## Versioning (Conventional Commits)

```bash
# Patch (1.0.0 -> 1.0.1)
git commit -m "fix: correct SVG coordinate rendering for flipped boards"
git commit -m "perf: cache piece SVG string parsing"

# Minor (1.0.0 -> 1.1.0)
git commit -m "feat: add highlightSquares option to generateDiagram"

# Major (1.0.0 -> 2.0.0)
git commit -m "feat!: rename generateDiagram to renderDiagram

BREAKING CHANGE: generateDiagram is now renderDiagram"
```

---

## For consumers: checking and installing versions

```bash
# Latest published version
npm view @chessviewer-org/chess-viewer version

# All published versions
npm view @chessviewer-org/chess-viewer versions --json

# Locally installed version
npm list @chessviewer-org/chess-viewer

# Latest stable
npm install @chessviewer-org/chess-viewer

# A specific version
npm install @chessviewer-org/chess-viewer@1.0.0

# Latest minor within a major (always the newest 1.x)
npm install @chessviewer-org/chess-viewer@^1.0.0

# Latest patch within a minor (stay on 1.2.x)
npm install @chessviewer-org/chess-viewer@~1.2.0

# Upgrade
npm update @chessviewer-org/chess-viewer
# or
npm install @chessviewer-org/chess-viewer@latest
```

---

## Pre-publish checklist

```bash
npm run build      # dist/ is up to date
npm test           # all 107 tests pass
npm run typecheck  # no TypeScript errors
npm pack --dry-run # confirm package contents
```

The `npm pack --dry-run` output should contain only:

- `dist/index.js`
- `dist/index.cjs`
- `dist/index.d.ts`
- `dist/index.d.cts`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `package.json`
