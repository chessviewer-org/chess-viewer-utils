import {
  parseFEN,
  validateFEN,
  boardToFEN,
  pieceToName,
  type BoardMatrix,
} from './fen.js';
import { DEFAULT_LIGHT_SQUARE, DEFAULT_DARK_SQUARE, STARTING_FEN } from './constants.js';
import { indicesToSquare, isLightSquare, squareToIndices } from './coordinates.js';

/**
 * DOM board builder for chess diagrams — a chessground-style renderer.
 *
 * Renders a board (64 squares + pieces + coordinates) into a container and
 * keeps it in sync with a FEN position. Framework-agnostic: only the browser
 * DOM is used. The container itself is owned by the caller; the board grid
 * and coordinate overlays are created inside it.
 *
 *   const board = createBoard(document.querySelector('#board'), {
 *     fen: STARTING_FEN,
 *     pieceStyle: 'cburnett',
 *   });
 *   board.set({ fen: '8/8/8/8/8/8/8/8 w - - 0 1' });
 *   board.toggleOrientation();
 */

export type BoardOrientation = 'white' | 'black';

export interface BoardClassNames {
  wrap: string;
  grid: string;
  square: string;
  piece: string;
  selected: string;
  coordsRanks: string;
  coordRank: string;
  coordsFiles: string;
  coordFile: string;
}

export interface BoardConfig {
  /** Full FEN or placement. Falls back to the previous position when invalid. */
  fen?: string;
  /** Which side is at the bottom of the board. */
  orientation?: BoardOrientation;
  /** Show rank/file coordinates. */
  coordinates?: boolean;
  /** Piece set id, e.g. `cburnett` (only used by the default piece theme). */
  pieceStyle?: string;
  lightSquare?: string;
  darkSquare?: string;
  /**
   * URL template for piece images. `{piece}` is replaced with the piece key
   * (`wK`, `bP`, ...) and `{style}` with the piece style.
   * @default '/piece/{style}/{piece}.svg'
   */
  pieceTheme?: string;
  /** CSS class overrides. Defaults match the chess-viewer app stylesheet. */
  className?: Partial<BoardClassNames>;
}

export type BoardSquareRef = string | readonly [number, number];

export interface BoardApi {
  /** Reconfigure the board. All options are partial; omitted ones are kept. */
  set(config: BoardConfig): void;
  /** Current position as a FEN placement string (no flags). */
  getFen(): string;
  getOrientation(): BoardOrientation;
  toggleOrientation(): void;
  /** Highlight (or clear) the selected square. */
  selectSquare(square: BoardSquareRef | null): void;
  getSquare(square: BoardSquareRef): HTMLElement | null;
  getGrid(): HTMLElement;
  destroy(): void;
}

const DEFAULT_CLASS_NAMES: BoardClassNames = {
  wrap: 'board-wrap',
  grid: 'board-grid',
  square: 'board-square',
  piece: 'board-piece',
  selected: 'board-square-selected',
  coordsRanks: 'coords-ranks',
  coordRank: 'coord-rank',
  coordsFiles: 'coords-files',
  coordFile: 'coord-file',
};

const FILES = 'abcdefgh';

function pieceKeyFor(cell: string): string {
  if (!cell) return '';
  const white = cell === cell.toUpperCase();
  return (white ? 'w' : 'b') + cell.toUpperCase();
}

function pieceAltForKey(key: string): string {
  if (!key || key.length !== 2) return 'Piece';
  const char = key[0] === 'w' ? key[1] : (key[1] ?? '').toLowerCase();
  return pieceToName(char).replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function resolveSquare(square: BoardSquareRef): [number, number] | null {
  if (typeof square === 'string') return squareToIndices(square);
  const [row, col] = square;
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return [row, col];
}

export function createBoard(container: HTMLElement, config: BoardConfig = {}): BoardApi {
  const cn: BoardClassNames = { ...DEFAULT_CLASS_NAMES, ...config.className };

  let orientation: BoardOrientation = config.orientation ?? 'white';
  let coordinates = config.coordinates ?? true;
  let pieceStyle = config.pieceStyle ?? 'cburnett';
  let pieceTheme = config.pieceTheme ?? '/piece/{style}/{piece}.svg';
  let lightSquare = config.lightSquare ?? DEFAULT_LIGHT_SQUARE;
  let darkSquare = config.darkSquare ?? DEFAULT_DARK_SQUARE;
  let board: BoardMatrix = safeParse(config.fen);
  let selected: [number, number] | null = null;

  const grid = document.createElement('div');
  grid.className = cn.grid;
  grid.setAttribute('role', 'grid');
  grid.tabIndex = 0;
  grid.setAttribute('aria-label', 'Chess board editor');

  const coordsRanks = document.createElement('div');
  coordsRanks.className = cn.coordsRanks;
  coordsRanks.setAttribute('data-coords-ranks', '');

  const coordsFiles = document.createElement('div');
  coordsFiles.className = cn.coordsFiles;
  coordsFiles.setAttribute('data-coords-files', '');

  const squares: HTMLButtonElement[] = [];
  const rankEls: HTMLElement[] = [];
  const fileEls: HTMLElement[] = [];

  function safeParse(fen: string | undefined): BoardMatrix {
    if (!fen || !validateFEN(fen.trim())) return parseFEN(STARTING_FEN);
    try {
      return parseFEN(fen.trim());
    } catch {
      return parseFEN(STARTING_FEN);
    }
  }

  function pieceUrl(key: string): string {
    return pieceTheme.replace(/\{piece\}/g, key).replace(/\{style\}/g, pieceStyle);
  }

  /** Visual square index (0..63) → logical [row, col]. */
  function visualToLogical(index: number): [number, number] {
    const dr = Math.floor(index / 8);
    const dc = index % 8;
    return orientation === 'black' ? [7 - dr, 7 - dc] : [dr, dc];
  }

  /**
   * Squares carry their VISUAL position in `data-r`/`data-c` (0..7 in display
   * order), like chessground; consumers map to logical squares themselves.
   * `aria-label` always holds the logical square name.
   */
  function buildSquares(): void {
    for (let i = 0; i < 64; i++) {
      const dr = Math.floor(i / 8);
      const dc = i % 8;
      const [row, col] = visualToLogical(i);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = cn.square;
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('data-r', String(dr));
      btn.setAttribute('data-c', String(dc));
      btn.setAttribute('aria-label', indicesToSquare(row, col));
      btn.setAttribute('aria-selected', 'false');
      btn.style.backgroundColor = isLightSquare(row, col) ? lightSquare : darkSquare;
      grid.appendChild(btn);
      squares.push(btn);
    }
  }

  function buildCoords(): void {
    for (let i = 0; i < 8; i++) {
      const rank = document.createElement('div');
      rank.className = cn.coordRank;
      coordsRanks.appendChild(rank);
      rankEls.push(rank);
      const file = document.createElement('div');
      file.className = cn.coordFile;
      coordsFiles.appendChild(file);
      fileEls.push(file);
    }
  }

  function syncPieces(): void {
    for (let i = 0; i < 64; i++) {
      const [row, col] = visualToLogical(i);
      const btn = squares[i];
      const cell = board[row]?.[col] ?? '';
      const key = pieceKeyFor(cell);
      const bg = isLightSquare(row, col) ? lightSquare : darkSquare;
      const label = indicesToSquare(row, col);
      const isSel = selected !== null && selected[0] === row && selected[1] === col;

      btn.style.backgroundColor = bg;
      btn.setAttribute('aria-label', label);
      btn.classList.toggle(cn.selected, isSel);
      btn.setAttribute('aria-selected', String(isSel));

      const img = btn.firstElementChild;
      if (key) {
        const src = pieceUrl(key);
        if (img instanceof HTMLImageElement) {
          if (img.getAttribute('src') !== src) img.setAttribute('src', src);
          const alt = pieceAltForKey(key);
          if (img.getAttribute('alt') !== alt) img.setAttribute('alt', alt);
        } else {
          const fresh = document.createElement('img');
          fresh.className = cn.piece;
          fresh.setAttribute('src', src);
          fresh.setAttribute('alt', pieceAltForKey(key));
          fresh.draggable = false;
          btn.appendChild(fresh);
        }
      } else if (img) {
        btn.removeChild(img);
      }
    }
  }

  function syncCoords(): void {
    for (let i = 0; i < 8; i++) {
      rankEls[i].textContent = String(orientation === 'black' ? i + 1 : 8 - i);
      fileEls[i].textContent = FILES[orientation === 'black' ? 7 - i : i] ?? '';
    }
    coordsRanks.hidden = !coordinates;
    coordsFiles.hidden = !coordinates;
  }

  function render(): void {
    syncPieces();
    syncCoords();
  }

  buildSquares();
  buildCoords();
  container.appendChild(grid);
  container.appendChild(coordsRanks);
  container.appendChild(coordsFiles);
  render();

  return {
    set(config: BoardConfig): void {
      if (config.fen !== undefined && config.fen.trim() !== boardToFEN(board)) {
        board = safeParse(config.fen);
      }
      if (config.orientation !== undefined) orientation = config.orientation;
      if (config.coordinates !== undefined) coordinates = config.coordinates;
      if (config.pieceStyle !== undefined) pieceStyle = config.pieceStyle;
      if (config.pieceTheme !== undefined) pieceTheme = config.pieceTheme;
      if (config.lightSquare !== undefined) lightSquare = config.lightSquare;
      if (config.darkSquare !== undefined) darkSquare = config.darkSquare;
      if (config.className) Object.assign(cn, config.className);
      render();
    },

    getFen(): string {
      return boardToFEN(board);
    },

    getOrientation(): BoardOrientation {
      return orientation;
    },

    toggleOrientation(): void {
      orientation = orientation === 'white' ? 'black' : 'white';
      selected = null;
      render();
    },

    selectSquare(square: BoardSquareRef | null): void {
      selected = square === null ? null : (resolveSquare(square) ?? selected);
      render();
    },

    getSquare(square: BoardSquareRef): HTMLElement | null {
      const idx = resolveSquare(square);
      if (!idx) return null;
      const [row, col] = idx;
      const index = orientation === 'black' ? (7 - row) * 8 + (7 - col) : row * 8 + col;
      return squares[index] ?? null;
    },

    getGrid(): HTMLElement {
      return grid;
    },

    destroy(): void {
      grid.remove();
      coordsRanks.remove();
      coordsFiles.remove();
      squares.length = 0;
      board = [];
      selected = null;
    },
  };
}
