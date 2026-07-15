import { type BoardMatrix, type PieceSymbol } from './fen.js';
import { squareToIndices, indicesToSquare } from './coordinates.js';

export type SquareRef = string | readonly [number, number];

function resolve(square: SquareRef): [number, number] | null {
  if (typeof square === 'string') return squareToIndices(square);
  const [row, col] = square;
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return [row, col];
}

export function cloneBoard(board: BoardMatrix): BoardMatrix {
  return board.map((row) => [...row]);
}

export function getPieceAt(board: BoardMatrix, square: SquareRef): PieceSymbol | null {
  const idx = resolve(square);
  if (!idx) return null;
  return board[idx[0]]?.[idx[1]] ?? null;
}

export function setPieceAt(board: BoardMatrix, square: SquareRef, piece: PieceSymbol): BoardMatrix {
  const idx = resolve(square);
  if (!idx) return board;
  const next = cloneBoard(board);
  const row = next[idx[0]];
  if (row) row[idx[1]] = piece;
  return next;
}

export function removePieceAt(board: BoardMatrix, square: SquareRef): BoardMatrix {
  return setPieceAt(board, square, '');
}

export function movePiece(board: BoardMatrix, from: SquareRef, to: SquareRef): BoardMatrix {
  const piece = getPieceAt(board, from);
  if (!piece) return board;
  const cleared = removePieceAt(board, from);
  return setPieceAt(cleared, to, piece);
}

export function flipBoard(board: BoardMatrix): BoardMatrix {
  return board.map((row) => [...row].reverse()).reverse();
}

export interface PiecePlacement {
  square: string;
  piece: PieceSymbol;
}

export function listPieces(board: BoardMatrix): PiecePlacement[] {
  const out: PiecePlacement[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row]?.[col];
      if (piece) out.push({ square: indicesToSquare(row, col), piece });
    }
  }
  return out;
}

export function countPieces(board: BoardMatrix): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of board) {
    for (const piece of row) {
      if (piece) counts[piece] = (counts[piece] ?? 0) + 1;
    }
  }
  return counts;
}

// Constants
const MATERIAL_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

export function materialBalance(board: BoardMatrix): number {
  let balance = 0;
  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;
      const value = MATERIAL_VALUES[piece.toLowerCase()] ?? 0;
      balance += piece === piece.toUpperCase() ? value : -value;
    }
  }
  return balance;
}

export function findKing(board: BoardMatrix, color: 'w' | 'b'): string | null {
  const target = color === 'w' ? 'K' : 'k';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row]?.[col] === target) return indicesToSquare(row, col);
    }
  }
  return null;
}

export function hasBothKings(board: BoardMatrix): boolean {
  const counts = countPieces(board);
  return counts['K'] === 1 && counts['k'] === 1;
}
