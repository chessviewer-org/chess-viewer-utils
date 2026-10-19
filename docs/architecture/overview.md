# Architecture overview

## Design principles

1. **Zero runtime dependencies.** Everything needed at runtime is implemented
   in-tree. This keeps the install footprint tiny and the supply chain minimal.
2. **Universal.** Code runs unchanged in Node.js and the browser. The core uses
   only standard primitives (`Uint8Array`, `ArrayBuffer`, `Blob`) — no `fs`,
   `Buffer`, `document`, or `window`.
3. **Pure and immutable.** Board operations return new values instead of
   mutating their inputs, making them safe to compose and easy to test.
4. **Typed public surface.** Every export carries explicit types; consumers get
   full IntelliSense with no `@types/*` package.

## Module map

| Module | Responsibility |
| ------ | -------------- |
| `fen.ts` | Parse/validate FEN board placement; matrix ↔ FEN. |
| `fen-record.ts` | Parse/serialize the full six-field FEN record. |
| `board.ts` | Pure board manipulation (move, flip, material, king lookup). |
| `svg.ts` | Render a self-contained SVG diagram. |
| `pieces.ts` | Inline CBurnett-style piece SVGs. |
| `colors.ts` | hex/RGB/HSV conversion and WCAG contrast math. |
| `constants.ts` | Board themes, piece sets, quality presets, FEN constants. |
| `themes.ts` | Theme/piece-set/preset lookups and contrast helpers. |
| `coordinates.ts` | Square ↔ index math and label geometry. |
| `history.ts` | History entry types and pure list utilities. |
| `image.ts` | Read PNG/JPEG dimensions; compute physical print sizes. |
| `dpi.ts` | Rewrite PNG `pHYs` / JPEG JFIF DPI metadata. |
| `annotations.ts` | Highlight, arrow and check-indicator types, validation and SVG overlays. |
| `pattern.ts` | Hatched dark-square geometry, piece halo and board outline shared by every renderer. |
| `interaction.ts` | Framework-free click, drag and palette-drop logic for board editors. |
| `board-dom.ts` | `createBoard`, a dependency-free DOM board built on `interaction.ts`. |
| `latex-core.ts` | LaTeX package metadata, FEN gate, text escaping and per-package board markup. |
| `latex-document.ts` | Multi-position documents: preamble, layout, captions and solutions. |
| `latex.ts` | Public LaTeX entry points (`generateBoardLatex`, `generateLatexDocument`). |
| `validation.ts` | Input sanitization helpers. |
| `index.ts` | Single public entry point — re-exports everything. |

## Build pipeline

- **Bundler:** `tsup` emits ESM (`dist/index.js`) and CJS (`dist/index.cjs`)
  plus declaration files (`dist/index.d.ts` / `.d.cts`).
- **Entry:** `src/index.ts` is the only entry; everything is re-exported there.
- **Package exports:** the `exports` map in `package.json` resolves `types`,
  `import`, and `require` conditions.
- **Tests:** the Node.js native test runner executes every `src/*.test.ts` file.
- **Release:** `semantic-release` computes the version from Conventional
  Commits, updates the changelog, publishes to npm over OIDC, and cuts a GitHub
  Release.
