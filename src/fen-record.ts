import { parseFEN, boardToFEN, FENParseError, type BoardMatrix } from './fen.js';

export type ActiveColor = 'w' | 'b';

export interface FENRecord {
  board: BoardMatrix;
  activeColor: ActiveColor;
  castling: string;
  enPassant: string;
  halfmove: number;
  fullmove: number;
}

const CASTLING_RE = /^(-|[KQkq]{1,4})$/;
const EN_PASSANT_RE = /^(-|[a-h][36])$/;

export function parseFENRecord(fen: string): FENRecord {
  if (!fen || typeof fen !== 'string') throw new FENParseError('Invalid FEN string');

  const parts = fen.trim().split(/\s+/);
  const [
    placement,
    activeColor = 'w',
    castling = '-',
    enPassant = '-',
    halfmoveRaw = '0',
    fullmoveRaw = '1',
  ] = parts;

  const board = parseFEN(placement ?? '');

  if (activeColor !== 'w' && activeColor !== 'b')
    throw new FENParseError(`Invalid active color '${activeColor}'`);

  if (!CASTLING_RE.test(castling))
    throw new FENParseError(`Invalid castling field '${castling}'`);
  if (castling !== '-' && new Set(castling).size !== castling.length)
    throw new FENParseError('Castling field contains duplicate characters');

  if (!EN_PASSANT_RE.test(enPassant))
    throw new FENParseError(`Invalid en passant square '${enPassant}'`);

  if (!/^\d+$/.test(halfmoveRaw))
    throw new FENParseError(`Invalid halfmove clock '${halfmoveRaw}'`);
  if (!/^\d+$/.test(fullmoveRaw))
    throw new FENParseError(`Invalid fullmove number '${fullmoveRaw}'`);

  const halfmove = parseInt(halfmoveRaw, 10);
  const fullmove = parseInt(fullmoveRaw, 10);
  if (fullmove < 1) throw new FENParseError('Fullmove number must be at least 1');

  return { board, activeColor, castling, enPassant, halfmove, fullmove };
}

export function buildFENRecord(record: Partial<FENRecord> & { board: BoardMatrix }): string {
  const {
    board,
    activeColor = 'w',
    castling = '-',
    enPassant = '-',
    halfmove = 0,
    fullmove = 1,
  } = record;
  return `${boardToFEN(board)} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

export function toggleActiveColor(record: FENRecord): FENRecord {
  return { ...record, activeColor: record.activeColor === 'w' ? 'b' : 'w' };
}

export function fenPlacementField(fen: string): string {
  return (fen ?? '').trim().split(/\s+/)[0] ?? '';
}

export function normalizeFEN(fen: string): string {
  return buildFENRecord(parseFENRecord(fen));
}
