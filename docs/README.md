# Documentation

Developer documentation for `@chessviewer-org/chess-viewer`.

For installation and a quick-start, see the [project README](../README.md).
For the public API surface, see the [API reference](../README.md#api-reference).

## Contents

### Guides

- [Rendering diagrams](./guides/rendering-diagrams.md) — generate SVG boards,
  theme them, and keep coordinates legible.
- [Editing positions](./guides/editing-positions.md) — parse FEN records and
  manipulate boards immutably.
- [Export pipeline](./guides/export-pipeline.md) — go from SVG to a
  print-ready raster with correct DPI.

### Architecture

- [Overview](./architecture/overview.md) — modules, design principles, and the
  build pipeline.

### Reference

- [FEN handling](./reference/fen.md) — what the parser accepts and how records
  are normalized.

> The full per-function API reference lives in the
> [README](../README.md#api-reference) and in the shipped TypeScript types.
