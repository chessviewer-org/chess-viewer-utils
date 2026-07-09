# Roadmap

This roadmap describes the direction of `@chessviewer-org/chess-viewer`. It is a
guide, not a contract — priorities shift with feedback and contributions.
Anything tracked here lives as a GitHub issue with the **`status: roadmap`**
label and is grouped under the matching [milestone](../../milestones).

Have an idea? Open a [discussion](../../discussions) or a
[feature request](../../issues/new?template=feature_request.yml).

---

## Released

### v1.0.0 — Foundation

- FEN parsing, validation, and full six-field record parse/serialize.
- Pure, immutable board manipulation helpers.
- Self-contained SVG diagram generation with an inline piece set.
- Board themes, piece sets, quality presets, and contrast-aware lookups.
- Color, coordinate, history, image, and DPI utilities.
- Configurable coordinate label color (`coordColor`).
- Dual ESM + CJS build with full TypeScript types; zero dependencies.

### v1.1.0 — Rendering options & drag-and-drop helpers

- Highlight squares and last-move/threat arrows in `generateDiagram`.
- Per-square custom colors and a check/checkmate glow indicator.
- Pixel ↔ square hit-testing (`pointToSquare`, `squareToPoint`) so a UI can
  build drag-and-drop or click-to-move on top of the board.
- Pure move helpers for drag interactions: `applyDragMove`, `applyDragRemove`,
  `applyPaletteDrop`, `resolveClick`.
- `coordStyle` option (`'border'` | `'inner'`) — inner-board coordinate
  placement, drawn in the square's own colors like lichess/chess.com.

---

## Planned

### v1.2.0 — More piece sets

- Bundle additional inline piece sets beyond the default CBurnett style.
- `getPieceSVG` overload to select a set by id.

### v1.3.0 — PGN & moves

- Lightweight PGN tag/movetext parsing (no full move legality engine).
- SAN ↔ coordinate helpers built on the existing board utilities.

### v2.0.0 — API consolidation (breaking)

- Revisit naming for consistency across modules.
- Tighten types where v1 was permissive.

---

## Out of scope

To stay small and dependency-free, the library intentionally does **not** aim to
be a full chess engine. The following are out of scope:

- Legal move generation, check/checkmate detection, or game-state validation.
- Raster (PNG/JPEG) rendering — `generateDiagram` outputs SVG; rasterization is
  left to the consumer (canvas, sharp, resvg, etc.). `changeDPI` and
  `readImageDimensions` exist to support those pipelines.
- Engine analysis, opening books, or move databases.
