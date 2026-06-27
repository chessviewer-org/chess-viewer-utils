# Roadmap

This roadmap describes the direction of `@chessvision-org/chess-vision`. It is a
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

---

## Planned

### v1.1.0 — Rendering options

- Highlight squares and last-move arrows in `generateDiagram`.
- Per-square custom colors and check/checkmate indicators.
- Optional inner-board coordinate placement (in addition to the border).

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
