// Types
export type PieceSymbol =
  | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
  | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  | '';

export type BoardMatrix = PieceSymbol[][];

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

// Constants
export const MAX_FEN_LENGTH = 93;

const VALID_PIECES = new Set(['p','n','b','r','q','k','P','N','B','R','Q','K']);
const VALID_DIGITS = new Set(['1','2','3','4','5','6','7','8']);

function isPieceSymbol(char: string): char is PieceSymbol {
  return VALID_PIECES.has(char);
}

export class FENParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FENParseError';
  }
}

function countRankSquares(rank: string): number | { badChar: string } {
  let count = 0;
  for (const char of rank) {
    if (VALID_DIGITS.has(char)) count += parseInt(char, 10);
    else if (VALID_PIECES.has(char)) count++;
    else return { badChar: char };
  }
  return count;
}

export function parseFEN(fenString: string): BoardMatrix {
  if (!fenString || typeof fenString !== 'string')
    throw new FENParseError('Invalid FEN string');
  if (fenString.length > MAX_FEN_LENGTH)
    throw new FENParseError('FEN string exceeds maximum length');

  const trimmed = fenString.trim();
  if (trimmed.length === 0) throw new FENParseError('FEN string is empty');

  const position = trimmed.split(/\s+/)[0] ?? '';
  const rows = position.split('/');
  if (rows.length !== 8)
    throw new FENParseError(`Invalid FEN: expected 8 ranks, got ${rows.length}`);

  const board: BoardMatrix = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row === undefined) continue;
    const boardRow: PieceSymbol[] = [];
    let squareCount = 0;
    for (const char of row) {
      if (VALID_DIGITS.has(char)) {
        const count = parseInt(char, 10);
        squareCount += count;
        for (let i = 0; i < count; i++) boardRow.push('');
      } else {
        if (!isPieceSymbol(char))
          throw new FENParseError(`Invalid piece character '${char}' in rank ${rowIndex + 1}`);
        squareCount++;
        boardRow.push(char);
      }
    }
    if (squareCount !== 8)
      throw new FENParseError(`Rank ${rowIndex + 1} has ${squareCount} squares instead of 8`);
    board.push(boardRow);
  }

  if (board.length !== 8)
    throw new FENParseError(`Invalid board structure: ${board.length} ranks`);
  return board;
}

export function validateFEN(fen: string): boolean {
  return getFENValidationError(fen) === '';
}

export function getFENValidationError(fen: string): string {
  try {
    if (!fen || typeof fen !== 'string') return 'FEN is empty';
    if (fen.length > MAX_FEN_LENGTH) return 'FEN string is too long';
    const position = fen.trim().split(/\s+/)[0] ?? '';
    const rows = position.split('/');
    if (rows.length !== 8) return 'Board must have 8 ranks';

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (row === undefined) continue;
      const count = countRankSquares(row);
      if (typeof count !== 'number') return `Invalid piece character: ${count.badChar}`;
      if (count !== 8) return `Rank ${rowIndex + 1} has ${count} squares`;
    }
    return '';
  } catch {
    return 'Invalid FEN';
  }
}

export function validateFENDetailed(fen: string): ValidationResult {
  if (!fen || typeof fen !== 'string') {
    return { isValid: false, errorMessage: 'Error: FEN string is empty or has an invalid format.' };
  }
  if (fen.length > MAX_FEN_LENGTH) {
    return { isValid: false, errorMessage: 'Error: FEN string is too long.' };
  }

  const trimmed = fen.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 6) {
    return {
      isValid: false,
      errorMessage: `Error: A valid FEN must have exactly 6 parts. You provided ${parts.length}.`
    };
  }

  const [position, activeColor, castling, enPassant, halfmove, fullmove] = parts;

  if (!position || !activeColor || !castling || !enPassant || !halfmove || !fullmove) {
    return { isValid: false, errorMessage: 'Error: Missing FEN parts.' };
  }

  const rows = position.split('/');
  if (rows.length !== 8) {
    return {
      isValid: false,
      errorMessage: `Error: The board must have 8 ranks, but yours has ${rows.length}.`
    };
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row === undefined) continue;
    const count = countRankSquares(row);
    if (typeof count !== 'number') {
      return {
        isValid: false,
        errorMessage: `Error: Invalid character '${count.badChar}' in the piece placement field.`
      };
    }
    if (count !== 8) {
      return {
        isValid: false,
        errorMessage: `Error: Rank ${rowIndex + 1} has ${count} squares instead of 8.`
      };
    }
  }

  if (activeColor !== 'w' && activeColor !== 'b') {
    return { isValid: false, errorMessage: "Error: Active color must be 'w' (white) or 'b' (black)." };
  }

  if (castling !== '-') {
    if (!/^[KQkq]{1,4}$/.test(castling)) {
      return { isValid: false, errorMessage: 'Error: Castling field is invalid.' };
    }
    const unique = new Set(castling);
    if (unique.size !== castling.length) {
      return { isValid: false, errorMessage: 'Error: Castling field contains duplicate characters.' };
    }
  }

  if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) {
    return {
      isValid: false,
      errorMessage: 'Error: En passant square is invalid (must be a file a-h on rank 3 or 6).'
    };
  }

  if (!/^\d+$/.test(halfmove) || !/^\d+$/.test(fullmove)) {
    return {
      isValid: false,
      errorMessage: 'Error: Halfmove clock and fullmove number must be non-negative integers.'
    };
  }

  if (parseInt(fullmove, 10) < 1) {
    return { isValid: false, errorMessage: 'Error: Fullmove number must be at least 1.' };
  }

  return { isValid: true, errorMessage: null };
}

export function createEmptyBoard(): BoardMatrix {
  return Array(8).fill(null).map(() => Array(8).fill(''));
}

export function boardToFEN(board: BoardMatrix): string {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    const row = board[r];
    if (!row) continue;
    let fenRow = '';
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      const piece = row[c];
      if (piece === '') {
        emptyCount++;
      } else {
        if (emptyCount > 0) { fenRow += emptyCount.toString(); emptyCount = 0; }
        fenRow += piece;
      }
    }
    if (emptyCount > 0) fenRow += emptyCount.toString();
    rows.push(fenRow);
  }
  return rows.join('/');
}

export function isBoardEmpty(board: BoardMatrix): boolean {
  return board.every((row) => row.every((piece) => piece === ''));
}

// Piece names for the human-readable board description
const PIECE_NAMES: Record<string, string> = {
  K: 'white king', Q: 'white queen', R: 'white rook',
  B: 'white bishop', N: 'white knight', P: 'white pawn',
  k: 'black king', q: 'black queen', r: 'black rook',
  b: 'black bishop', n: 'black knight', p: 'black pawn',
};

export function pieceToName(piece: string): string {
  return PIECE_NAMES[piece] ?? piece;
}

export function describeBoardPosition(board: BoardMatrix, flipped = false): string {
  const white: string[] = [];
  const black: string[] = [];
  const files = 'abcdefgh';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r]?.[c];
      if (!piece) continue;
      const displayRow = flipped ? r : 7 - r;
      const displayCol = flipped ? 7 - c : c;
      const square = `${files[displayCol] ?? c}${displayRow + 1}`;
      const name = pieceToName(piece);
      if (piece === piece.toUpperCase()) white.push(`${name} ${square}`);
      else black.push(`${name} ${square}`);
    }
  }
  if (white.length === 0 && black.length === 0) return 'Empty board';
  const parts: string[] = [];
  if (white.length > 0) parts.push(`White: ${white.join(', ')}`);
  if (black.length > 0) parts.push(`Black: ${black.join(', ')}`);
  return parts.join('. ');
}
