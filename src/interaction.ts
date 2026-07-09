import { type BoardMatrix, type PieceSymbol } from './fen.js';
import { movePiece, removePieceAt, setPieceAt, getPieceAt } from './board.js';
import { indicesToSquare } from './coordinates.js';

export interface BoardPoint {
  x: number;
  y: number;
}

export interface HitTestOptions {
  size: number;
  flipped?: boolean;
  offsetX?: number;
  offsetY?: number;
}

// hit-test
export function pointToSquare(point: BoardPoint, options: HitTestOptions): string | null {
  const { size, flipped = false, offsetX = 0, offsetY = 0 } = options;
  const localX = point.x - offsetX;
  const localY = point.y - offsetY;
  if (localX < 0 || localY < 0 || localX >= size || localY >= size) return null;

  const squareSize = size / 8;
  const visCol = Math.floor(localX / squareSize);
  const visRow = Math.floor(localY / squareSize);

  // flip
  const row = flipped ? 7 - visRow : visRow;
  const col = flipped ? 7 - visCol : visCol;
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return indicesToSquare(row, col);
}

export function squareToPoint(
  square: string,
  options: HitTestOptions
): { x: number; y: number; size: number } | null {
  const { size, flipped = false, offsetX = 0, offsetY = 0 } = options;
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1] ?? '', 10);
  if (file < 0 || file > 7 || isNaN(rank) || rank < 1 || rank > 8) return null;

  const row = 8 - rank;
  const col = file;
  const visRow = flipped ? 7 - row : row;
  const visCol = flipped ? 7 - col : col;
  const squareSize = size / 8;
  return {
    x: offsetX + visCol * squareSize,
    y: offsetY + visRow * squareSize,
    size: squareSize,
  };
}

export interface DragMoveResult {
  board: BoardMatrix;
  moved: boolean;
  captured: PieceSymbol | null;
}

// move
export function applyDragMove(board: BoardMatrix, from: string, to: string): DragMoveResult {
  const piece = getPieceAt(board, from);
  if (!piece || from === to) {
    return { board, moved: false, captured: null };
  }
  const captured = getPieceAt(board, to) || null;
  return { board: movePiece(board, from, to), moved: true, captured };
}

export function applyDragRemove(board: BoardMatrix, from: string): BoardMatrix {
  return removePieceAt(board, from);
}

export function applyPaletteDrop(board: BoardMatrix, to: string, piece: PieceSymbol): BoardMatrix {
  return setPieceAt(board, to, piece);
}

export type ClickResolution =
  | { kind: 'select'; square: string }
  | { kind: 'deselect' }
  | { kind: 'move'; from: string; to: string };

// tap-to-move
export function resolveClick(
  clickedSquare: string,
  selected: string | null,
  board: BoardMatrix
): ClickResolution {
  if (selected === null) {
    const piece = getPieceAt(board, clickedSquare);
    return piece ? { kind: 'select', square: clickedSquare } : { kind: 'deselect' };
  }
  if (clickedSquare === selected) {
    return { kind: 'deselect' };
  }
  const clickedPiece = getPieceAt(board, clickedSquare);
  if (clickedPiece) {
    return { kind: 'select', square: clickedSquare };
  }
  return { kind: 'move', from: selected, to: clickedSquare };
}
