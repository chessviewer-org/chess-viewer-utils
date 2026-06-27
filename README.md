# @chessvision-org/chess-vision

Chess diagram generator and FEN utilities. Parse and edit FEN positions, render SVG board diagrams, manipulate boards, work with colors, board themes, presets, images, and history — in Node.js or the browser with **no dependencies and no DOM required**.

[![npm version](https://img.shields.io/npm/v/@chessvision-org/chess-vision)](https://www.npmjs.com/package/@chessvision-org/chess-vision)
[![npm downloads](https://img.shields.io/npm/dm/@chessvision-org/chess-vision)](https://www.npmjs.com/package/@chessvision-org/chess-vision)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@chessvision-org/chess-vision)](https://bundlephobia.com/package/@chessvision-org/chess-vision)
[![CI](https://github.com/chessvision-org/chess-vision-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/chessvision-org/chess-vision-utils/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/@chessvision-org/chess-vision)](https://www.npmjs.com/package/@chessvision-org/chess-vision)
[![license](https://img.shields.io/npm/l/@chessvision-org/chess-vision)](LICENSE)

- **Zero dependencies** — nothing pulled into your tree.
- **Universal** — runs in Node.js and the browser, no DOM, no canvas, no network.
- **Dual ESM + CJS** with first-class TypeScript types.
- **Batteries included** — FEN parsing/editing, SVG rendering with an inline piece set, 20 board themes, color & DPI utilities, and more.

---

## Install

```bash
npm install @chessvision-org/chess-vision
# or
pnpm add @chessvision-org/chess-vision
# or
yarn add @chessvision-org/chess-vision
```

**Requirements:** Node.js ≥ 18, or any modern browser.

---

## Quick start

```ts
import { generateDiagram, parseFEN, validateFEN } from '@chessvision-org/chess-vision';

// Generate a self-contained SVG diagram
const svg = generateDiagram({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  size: 400,
  showCoords: true,
  lightSquare: '#f0d9b5',
  darkSquare: '#b58863',
});

// Write to a file (Node.js)
import { writeFileSync } from 'fs';
writeFileSync('board.svg', svg);

// Or embed directly in HTML
document.getElementById('board').innerHTML = svg;
```

### Example output

The diagram below is real SVG produced by `generateDiagram` — no images, no canvas:

<p align="center">
  <img src="https://raw.githubusercontent.com/chessvision-org/chess-vision-utils/main/assets/preview.svg" width="360" alt="Chess diagram rendered by chess-vision (Italian Game, Wood theme)">
</p>

---

## Versioning

This package follows [Semantic Versioning](https://semver.org/):
- **Patch** (`1.0.x`) — bug fixes, no API changes
- **Minor** (`1.x.0`) — new exports added, fully backward-compatible
- **Major** (`x.0.0`) — breaking API changes

### Install a specific version

```bash
# Latest stable
npm install @chessvision-org/chess-vision

# Specific version
npm install @chessvision-org/chess-vision@1.0.0

# Latest minor of a major (e.g. 1.x)
npm install @chessvision-org/chess-vision@^1.0.0

# Exact patch
npm install @chessvision-org/chess-vision@~1.0.0
```

### Check what version you have

```bash
npm list @chessvision-org/chess-vision
```

### Check the latest version on npm

```bash
npm view @chessvision-org/chess-vision version
# or all published versions:
npm view @chessvision-org/chess-vision versions --json
```

### Upgrade to latest

```bash
npm update @chessvision-org/chess-vision
# or force latest:
npm install @chessvision-org/chess-vision@latest
```

See [CHANGELOG.md](CHANGELOG.md) for what changed in each release.

---

## API Reference

### `generateDiagram(options)`

Generates a self-contained SVG chess diagram. No DOM, no network requests.

```ts
import { generateDiagram } from '@chessvision-org/chess-vision';

const svg = generateDiagram({
  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  size: 480,            // board pixel size (default: 400)
  showCoords: true,     // show a/b/c… and 1/2/3… labels (default: false)
  flipped: false,       // show from Black's perspective (default: false)
  showFrame: false,     // thin outer frame (default: false)
  lightSquare: '#d4af7a',
  darkSquare: '#8b4513',
  coordColor: 'white',  // hex or 'white' | 'black' — keep coords legible on dark boards (default: '#000000')
  label: 'Starting position after 1.e4',  // aria-label (default: 'Chess position')
});
// → '<svg xmlns="http://www.w3.org/2000/svg" …>…</svg>'
```

---

### FEN utilities

```ts
import {
  parseFEN,
  validateFEN,
  validateFENDetailed,
  getFENValidationError,
  boardToFEN,
  createEmptyBoard,
  isBoardEmpty,
  pieceToName,
  describeBoardPosition,
  FENParseError,
} from '@chessvision-org/chess-vision';

// Parse FEN → 8×8 matrix
const board = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
// board[0][0] === 'r', board[7][4] === 'K'

// Quick validity check
validateFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');  // → true

// Human-readable error for UI
getFENValidationError('bad/fen');  // → 'Board must have 8 ranks'

// Detailed error with user-facing messages
const result = validateFENDetailed('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
// → { isValid: true, errorMessage: null }

// Matrix → FEN piece placement
boardToFEN(board);  // → 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'

// Screen-reader description of position
describeBoardPosition(board);
// → 'White: white king e1, white queen d1, … Black: black king e8, …'

// FEN parse errors
try {
  parseFEN('not-valid');
} catch (e) {
  if (e instanceof FENParseError) console.error(e.message);
}
```

---

### Full FEN record

Parse and serialize all six FEN fields — board, side to move, castling rights,
en passant target, and move clocks. Placement-only strings parse too, filling
standard defaults.

```ts
import {
  parseFENRecord,
  buildFENRecord,
  toggleActiveColor,
  fenPlacementField,
  normalizeFEN,
} from '@chessvision-org/chess-vision';

const record = parseFENRecord('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 5 12');
// → { board, activeColor: 'b', castling: 'KQkq', enPassant: 'e3', halfmove: 5, fullmove: 12 }

buildFENRecord(record);              // → 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 5 12'
toggleActiveColor(record).activeColor; // → 'w'  (pure, no mutation)

fenPlacementField('rnbqkbnr/… w KQkq - 0 1'); // → 'rnbqkbnr/…'
normalizeFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
// → 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1'
```

---

### Board manipulation

Pure helpers for editing positions — every function returns a new board and
never mutates its input. Squares accept either algebraic strings (`'e4'`) or
`[row, col]` matrix indices.

```ts
import {
  cloneBoard,
  getPieceAt, setPieceAt, removePieceAt, movePiece,
  flipBoard, listPieces, countPieces,
  materialBalance, findKing, hasBothKings,
} from '@chessvision-org/chess-vision';

const board = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

getPieceAt(board, 'e1');            // → 'K'
const next = movePiece(board, 'b1', 'c3');  // develops the knight, returns a new board
removePieceAt(next, 'd8');          // → new board with Black's queen removed

flipBoard(board);                   // rotate 180° for Black's perspective
listPieces(board);                  // → [{ square: 'a8', piece: 'r' }, …]  (a8 → h1)
countPieces(board);                 // → { r: 2, n: 2, …, P: 8 }
materialBalance(board);             // → 0  (positive = White ahead)
findKing(board, 'w');               // → 'e1'
hasBothKings(board);                // → true  (exactly one king per side)
```

---

### Theme & preset helpers

Look up board themes, piece sets, and quality presets, with contrast-aware
helpers for legible coordinates.

```ts
import {
  getBoardTheme, listThemeIds,
  getPieceSet, pieceSetsByPopularity,
  getQualityPreset,
  themeContrast, themeCoordinateColor,
} from '@chessvision-org/chess-vision';

getBoardTheme('ocean');             // → { name: 'Ocean', light: '#c9e4f5', dark: '#4a90a4' }
listThemeIds();                     // → ['classic', 'brown', 'wood', …]

getPieceSet('cburnett');            // → { id: 'cburnett', name: 'Classic (CBurnett)' }
pieceSetsByPopularity()[0];         // → { id: 'cburnett', … }  (most popular first)

getQualityPreset(2);                // → { value: 2, label: 'Print 2× (600 DPI)', … }

const theme = getBoardTheme('classic')!;
themeContrast(theme);               // → WCAG contrast ratio between squares
themeCoordinateColor(theme);        // → 'white' | 'black'  (best on dark squares)
```

---

### Image utilities

Read raster dimensions straight from PNG/JPEG headers (no decoding, no DOM) and
compute physical print sizes — pairs naturally with `changeDPI`.

```ts
import { readImageDimensions, physicalSize } from '@chessvision-org/chess-vision';

const bytes = new Uint8Array(await blob.arrayBuffer());
readImageDimensions(bytes);         // → { width: 1200, height: 1200 } | null

physicalSize(1200, 300);            // → { inches: 4, mm: 101.6 }
```

---

### Board themes & constants

```ts
import {
  BOARD_THEMES,
  PIECE_SETS,
  PIECE_SET_POPULARITY,
  QUALITY_PRESETS,
  DEFAULT_LIGHT_SQUARE,
  DEFAULT_DARK_SQUARE,
  STARTING_FEN,
  EMPTY_FEN,
} from '@chessvision-org/chess-vision';

// 20 built-in board color themes
BOARD_THEMES.classic   // { name: 'Classic', light: '#f0d9b5', dark: '#b58863' }
BOARD_THEMES.ocean     // { name: 'Ocean', light: '#c9e4f5', dark: '#4a90a4' }

// 23 Lichess-compatible piece sets
PIECE_SETS[0]  // { id: 'alpha', name: 'Alpha' }

// Popularity-ranked piece set ids (most → least)
PIECE_SET_POPULARITY[0]  // 'cburnett'

// Print/social quality presets (DPI multipliers)
QUALITY_PRESETS  // [{value:1, label:'Print 1× (300 DPI)', mode:'print', …}, …]

// Convenient FEN constants
STARTING_FEN  // 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
EMPTY_FEN     // '8/8/8/8/8/8/8/8 w - - 0 1'
```

---

### Color utilities

```ts
import {
  hexToRgb, rgbToHex,
  rgbToHsv, hsvToRgb,
  hexToHsv, hsvToHex,
  relativeLuminance,
  contrastRatio,
  bestTextColor,
} from '@chessvision-org/chess-vision';

hexToRgb('#b58863')   // → { r: 181, g: 136, b: 99 }
rgbToHex(181, 136, 99) // → '#b58863'

const { h, s, v } = hexToHsv('#b58863');
hsvToHex(h, s, v)     // → '#b58863'

contrastRatio('#000000', '#ffffff')  // → 21
bestTextColor('#b58863')             // → 'white' | 'black'
```

---

### Coordinate utilities

```ts
import {
  squareToIndices,
  indicesToSquare,
  getSquareBounds,
  isLightSquare,
  getCoordinateParams,
} from '@chessvision-org/chess-vision';

squareToIndices('e4')    // → [4, 4]  (row 0 = rank 8)
indicesToSquare(4, 4)    // → 'e4'
squareToIndices('a8')    // → [0, 0]
squareToIndices('h1')    // → [7, 7]

isLightSquare(0, 0)      // → true  (a8 is light)
isLightSquare(7, 0)      // → false (a1 is dark)

// Pixel bounds of a square (for canvas rendering)
getSquareBounds(0, 0, 50)  // → { x:0, y:0, width:50, height:50, centerX:25, centerY:25 }
```

---

### History utilities

```ts
import {
  createHistoryEntry,
  calculateStatus,
  sortByMostRecent,
  applyFilters,
  mergeById,
  convertToArchivedEntry,
} from '@chessvision-org/chess-vision';

const entry = createHistoryEntry(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'manual'
);
// → { id: 1234567890, fen: '…', createdAt: …, lastActiveAt: …, source: 'manual', isFavorite: false }

calculateStatus(entry.lastActiveAt)  // → 'green' | 'yellow' | 'red'

// Filter entries
applyFilters(entries, { fenSearch: 'e4', favoritesOnly: false, source: 'manual' });

// Merge two lists (e.g. cloud + local), primary wins on id collision
mergeById(cloudEntries, localEntries);
```

---

### Validation utilities

```ts
import {
  isValidHexColor,
  sanitizeHexColor,
  sanitizeFileName,
  sanitizeInput,
  safeJSONParse,
} from '@chessvision-org/chess-vision';

isValidHexColor('#f0d9b5')      // → true
isValidHexColor('red')          // → false

sanitizeHexColor('bad', '#fff') // → '#fff'
sanitizeHexColor('#aabbcc')     // → '#aabbcc'

sanitizeFileName('my<board>')   // → 'my-board-'
sanitizeInput('<script>xss')    // → '&lt;script&gt;xss'

safeJSONParse('{"a":1}', {})   // → { a: 1 }
safeJSONParse('bad json', {})  // → {}  (fallback, no throw)
```

---

### DPI encoding

```ts
import { changeDPI } from '@chessvision-org/chess-vision';

// Rewrite DPI metadata in a PNG or JPEG blob
const correctedBlob = await changeDPI(originalBlob, 300, 'png');
const correctedJpeg = await changeDPI(originalBlob, 150, 'jpeg');
```

---

### Inline piece SVGs

```ts
import { getPieceSVG, PIECES } from '@chessvision-org/chess-vision';

getPieceSVG('K')   // → '<svg …>…</svg>'  (white king, CBurnett style)
getPieceSVG('k')   // → '<svg …>…</svg>'  (black king)
getPieceSVG('X')   // → null

// All 12 pieces
Object.keys(PIECES)  // → ['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP']
```

---

## TypeScript

This package ships full TypeScript types. No `@types/…` package needed.

```ts
import type {
  PieceSymbol,
  BoardMatrix,
  DiagramOptions,
  ValidationResult,
  FENRecord,
  ActiveColor,
  SquareRef,
  PiecePlacement,
  ActiveHistoryEntry,
  ArchivedHistoryEntry,
  HistoryFilters,
  BoardTheme,
  QualityPreset,
  PieceSet,
  CoordinateParams,
  SquareBounds,
  ImageDimensions,
} from '@chessvision-org/chess-vision';
```

---

## Documentation & project

- [Documentation](docs/README.md) — guides, architecture, and references.
- [Roadmap](ROADMAP.md) — what's planned and what's out of scope.
- [Changelog](CHANGELOG.md) — what changed in each release.
- [Contributing](CONTRIBUTING.md) — how to propose and submit changes.
- [Security policy](SECURITY.md) — how to report a vulnerability.
- [Discussions](https://github.com/chessvision-org/chess-vision-utils/discussions) — questions and ideas.

---

## License

[AGPL-3.0](LICENSE)
