# Changelog

All notable changes to `@chessvision-org/chess-vision` are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- **`generateDiagram` `coordColor` option** — configurable rank/file coordinate
  label color. Accepts a hex string or the names `'white'` / `'black'` (e.g. the
  result of `themeCoordinateColor`), so coordinates stay legible on dark boards.
  Defaults to `'#000000'` for backward compatibility.

---

## [1.0.0] - 2026-06-27

Initial public release of the ChessVision utility toolkit.

### Added

- **`generateDiagram(options)`** — Self-contained SVG chess diagram from a FEN string. No DOM, no network. Supports coordinates, board flip, custom colors, thin frame, and accessible `aria-label`.
- **FEN parser** — `parseFEN()` returns an 8×8 `BoardMatrix`. Throws `FENParseError` on invalid input.
- **FEN validators** — `validateFEN()`, `getFENValidationError()`, `validateFENDetailed()` for quick checks and detailed user-facing error messages.
- **Full FEN record** — `parseFENRecord()` / `buildFENRecord()` parse and serialize all six FEN fields (board, side to move, castling, en passant, clocks), plus `toggleActiveColor()`, `fenPlacementField()`, and `normalizeFEN()`.
- **Board utilities** — `boardToFEN()`, `createEmptyBoard()`, `isBoardEmpty()`, `pieceToName()`, `describeBoardPosition()`.
- **Board manipulation** — pure, immutable helpers `cloneBoard`, `getPieceAt`, `setPieceAt`, `removePieceAt`, `movePiece`, `flipBoard`, `listPieces`, `countPieces`, `materialBalance`, `findKing`, `hasBothKings`. Squares accept algebraic strings or `[row, col]` indices.
- **Inline piece SVGs** — All 12 CBurnett/Lichess-style piece SVGs embedded (`getPieceSVG()`, `PIECES`). No CDN dependency.
- **Color utilities** — `hexToRgb`, `rgbToHex`, `rgbToHsv`, `hsvToRgb`, `hexToHsv`, `hsvToHex`, `relativeLuminance`, `contrastRatio`, `bestTextColor`.
- **Board themes** — `BOARD_THEMES` with 20 named themes (Classic, Ocean, Forest, …).
- **Piece sets** — `PIECE_SETS` (23 Lichess-compatible sets), `PIECE_SET_POPULARITY` ranking.
- **Quality presets** — `QUALITY_PRESETS` for print (300/600 DPI) and social (900/1200 DPI) export.
- **Theme & preset lookups** — `getBoardTheme`, `listThemeIds`, `getPieceSet`, `pieceSetsByPopularity`, `getQualityPreset`, `themeContrast`, `themeCoordinateColor`.
- **Constants** — `DEFAULT_LIGHT_SQUARE`, `DEFAULT_DARK_SQUARE`, `STARTING_FEN`, `EMPTY_FEN`.
- **Validation helpers** — `isValidHexColor`, `sanitizeHexColor`, `sanitizeFileName`, `sanitizeInput`, `safeJSONParse`, `isRecord`.
- **History utilities** — `createHistoryEntry`, `calculateStatus`, `touchEntry`, `sortByMostRecent`, `sortArchivedByArchiveDate`, `mergeById`, `applyFilters`, `partitionByArchiveStatus`, `convertToArchivedEntry` plus all associated types.
- **Coordinate math** — `squareToIndices`, `indicesToSquare`, `getSquareBounds`, `isLightSquare`, `getCoordinateParams`, `getDisplayCoordinates`.
- **Image utilities** — `readImageDimensions()` reads PNG/JPEG pixel dimensions straight from the header (no decoding, no DOM); `physicalSize()` converts pixels to print inches/mm at a given DPI.
- **DPI encoder** — `changeDPI()` rewrites PNG `pHYs` chunk and JPEG JFIF DPI metadata. Works in Node.js and browsers.
- Full TypeScript types shipped — no `@types/…` needed.
- Dual ESM + CJS build (`dist/index.js` + `dist/index.cjs`).
- 107 unit tests with the Node.js native test runner.

[Unreleased]: https://github.com/chessvision-org/chess-vision-utils/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/chessvision-org/chess-vision-utils/releases/tag/v1.0.0
