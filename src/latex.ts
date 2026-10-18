import { MAX_FEN_LENGTH, validateFENDetailed } from './fen.js';
import { normalizeFEN } from './fen-record.js';

export const LATEX_PACKAGES = ['skak', 'chessboard'] as const;
export const LATEX_BOARD_SIZES = ['tiny', 'small', 'normal', 'large'] as const;

export const LATEX_BOARD_SIZE_PT: Record<LatexBoardSize, number> = {
  tiny: 10,
  small: 15,
  normal: 20,
  large: 30,
};

export type LatexPackage = (typeof LATEX_PACKAGES)[number];
export type LatexOutputMode = 'snippet' | 'document';
export type LatexBoardSize = (typeof LATEX_BOARD_SIZES)[number];

export interface LatexPackageMeta {
  label: string;
  usePackage: string;
  description: string;
}

export interface LatexExportConfig {
  fen: string;
  latexPackage?: LatexPackage;
  flipped?: boolean;
  showCoords?: boolean;
  mode?: LatexOutputMode;
  boardSize?: LatexBoardSize;
  showMover?: boolean;
}

export const LATEX_PACKAGE_META: Record<LatexPackage, LatexPackageMeta> = {
  skak: {
    label: 'skak',
    usePackage: '\\usepackage{skak}',
    description: 'Diagrams from \\fenboard and \\showboard.',
  },
  chessboard: {
    label: 'chessboard',
    usePackage: '\\usepackage{chessboard}',
    description: 'Key-value diagrams from \\chessboard[setfen=…].',
  },
};

const SAFE_FEN_PATTERN = /^[A-Za-z0-9/ -]+$/;
const DOCUMENT_CLASS = '\\documentclass{article}';

export function isLatexPackage(value: unknown): value is LatexPackage {
  return (
    typeof value === 'string' &&
    (LATEX_PACKAGES as readonly string[]).includes(value)
  );
}

export function isLatexBoardSize(value: unknown): value is LatexBoardSize {
  return (
    typeof value === 'string' &&
    (LATEX_BOARD_SIZES as readonly string[]).includes(value)
  );
}

function resolveBoardSize(value: unknown): LatexBoardSize {
  if (value === undefined) return 'normal';
  if (!isLatexBoardSize(value)) fail(`unsupported board size "${String(value)}"`);
  return value;
}

function fail(reason: string): never {
  throw new Error(`LaTeX export failed: ${reason}`);
}

function resolveFen(fen: unknown): string {
  if (typeof fen !== 'string' || !fen.trim()) fail('FEN is missing');

  let normalized: string;
  try {
    normalized = normalizeFEN(fen.trim());
  } catch (err: unknown) {
    fail(err instanceof Error ? err.message : 'invalid FEN');
  }

  if (normalized.length > MAX_FEN_LENGTH) {
    fail(`FEN exceeds maximum length of ${MAX_FEN_LENGTH} characters`);
  }

  const { isValid, errorMessage } = validateFENDetailed(normalized);
  if (!isValid) fail(errorMessage ?? 'invalid FEN');

  if (!SAFE_FEN_PATTERN.test(normalized)) {
    fail('FEN contains characters that are unsafe in LaTeX markup');
  }
  return normalized;
}

function buildSkakBody(fen: string, config: LatexExportConfig, size: LatexBoardSize): string[] {
  const lines = [`\\fenboard{${fen}}`];
  const hideCoords = config.showCoords === false;
  const resize = size !== 'normal';
  if (hideCoords) lines.push('\\notationoff');
  if (resize) lines.push(`\\${size}board`);
  lines.push(config.flipped ? '\\showinverseboard' : '\\showboard');
  if (resize) lines.push('\\normalboard');
  if (hideCoords) lines.push('\\notationon');
  return lines;
}

function buildChessboardBody(fen: string, config: LatexExportConfig, size: LatexBoardSize): string[] {
  const keys = [`setfen=${fen}`];
  if (config.flipped) keys.push('inverse=true');
  if (config.showCoords === false) keys.push('label=false');
  if (config.showMover === false) keys.push('showmover=false');
  if (size !== 'normal') keys.push(`boardfontsize=${LATEX_BOARD_SIZE_PT[size]}pt`);

  if (keys.length === 1) return [`\\chessboard[${keys[0]}]`];

  const last = keys.length - 1;
  return [
    '\\chessboard[',
    ...keys.map((key, index) => `  ${key}${index === last ? '' : ','}`),
    ']',
  ];
}

export function generateBoardLatex(config: LatexExportConfig): string {
  if (!config) fail('config is null or undefined');

  const latexPackage = config.latexPackage ?? 'skak';
  if (!isLatexPackage(latexPackage)) {
    fail(`unsupported package "${String(latexPackage)}"`);
  }

  const fen = resolveFen(config.fen);
  const size = resolveBoardSize(config.boardSize);
  const body =
    latexPackage === 'skak'
      ? buildSkakBody(fen, config, size)
      : buildChessboardBody(fen, config, size);

  const { usePackage } = LATEX_PACKAGE_META[latexPackage];

  if (config.mode === 'document') {
    return [
      DOCUMENT_CLASS,
      usePackage,
      '\\begin{document}',
      ...body,
      '\\end{document}',
    ].join('\n');
  }

  return [usePackage, ...body].join('\n');
}
