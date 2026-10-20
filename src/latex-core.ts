import { isValidArrow, isValidHighlight } from './annotations.js';
import type { Arrow, SquareHighlight } from './annotations.js';
import { fenPlacementField, normalizeFEN } from './fen-record.js';
import { MAX_FEN_LENGTH, validateFENDetailed } from './fen.js';

export const LATEX_PACKAGES = ['skak', 'chessboard', 'diagram'] as const;
export const LATEX_BOARD_SIZES = ['tiny', 'small', 'normal', 'large'] as const;

export const LATEX_BOARD_SIZE_PT: Record<LatexBoardSize, number> = {
  tiny: 10,
  small: 15,
  normal: 20,
  large: 30,
};

export const LATEX_DIAGRAM_SIZE_PT: Record<LatexBoardSize, 10 | 11 | 12> = {
  tiny: 10,
  small: 10,
  normal: 11,
  large: 12,
};

export type LatexPackage = (typeof LATEX_PACKAGES)[number];
export type LatexOutputMode = 'snippet' | 'document' | 'standalone';
export type LatexBoardSize = (typeof LATEX_BOARD_SIZES)[number];

export const LATEX_CAPTION_STYLES = [
  'classic',
  'problem',
  'study',
  'game',
  'plain',
] as const;
export type LatexCaptionStyle = (typeof LATEX_CAPTION_STYLES)[number];

export interface LatexPackageMeta {
  label: string;
  usePackage: string;
  description: string;
  supportsFlip: boolean;
  supportsMarks: boolean;
}

export interface LatexPosition {
  fen: string;
  flipped?: boolean;
  highlights?: readonly SquareHighlight[];
  arrows?: readonly Arrow[];
  caption?: string;
  author?: string;
  source?: string;
  award?: string;
  stipulation?: string;
  remark?: string;
  solution?: string;
  white?: string;
  black?: string;
  event?: string;
  date?: string;
  captionStyle?: LatexCaptionStyle;
}

export const LATEX_PACKAGE_META: Record<LatexPackage, LatexPackageMeta> = {
  skak: {
    label: 'skak',
    usePackage: '\\usepackage{skak}',
    description: 'Diagrams from \\fenboard and \\showboard.',
    supportsFlip: true,
    supportsMarks: false,
  },
  chessboard: {
    label: 'chessboard',
    usePackage: '\\usepackage{chessboard}',
    description:
      'Key-value diagrams from \\chessboard[setfen=…] with highlighted squares and arrows.',
    supportsFlip: true,
    supportsMarks: true,
  },
  diagram: {
    label: 'diagram',
    usePackage: '\\usepackage{diagram}',
    description:
      'Problem-book layout from chess-problem-diagrams: author, source, award, stipulation and piece count under hatched boards.',
    supportsFlip: false,
    supportsMarks: false,
  },
};

const SAFE_FEN_PATTERN = /^[A-Za-z0-9/ -]+$/;
const MAX_TEXT_LENGTH = 2000;
const DEFAULT_HIGHLIGHT_COLOR = '#ffeb3b';
const DEFAULT_ARROW_COLOR = '#15781b';
const FILL_TINT_PERCENT = 55;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

const LATEX_ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

export function fail(reason: string): never {
  throw new Error(`LaTeX export failed: ${reason}`);
}

export function isLatexPackage(value: unknown): value is LatexPackage {
  return (
    typeof value === 'string' &&
    (LATEX_PACKAGES as readonly string[]).includes(value)
  );
}

export function isLatexCaptionStyle(
  value: unknown
): value is LatexCaptionStyle {
  return (
    typeof value === 'string' &&
    (LATEX_CAPTION_STYLES as readonly string[]).includes(value)
  );
}

export function resolveCaptionStyle(
  value: unknown,
  fallback: LatexCaptionStyle
): LatexCaptionStyle {
  if (value === undefined) return fallback;
  if (!isLatexCaptionStyle(value)) {
    fail(`unsupported caption style "${String(value)}"`);
  }
  return value;
}

export function isLatexBoardSize(value: unknown): value is LatexBoardSize {
  return (
    typeof value === 'string' &&
    (LATEX_BOARD_SIZES as readonly string[]).includes(value)
  );
}

export function resolvePackage(value: unknown): LatexPackage {
  if (value === undefined) return 'skak';
  if (!isLatexPackage(value)) fail(`unsupported package "${String(value)}"`);
  return value;
}

export function resolveBoardSize(value: unknown): LatexBoardSize {
  if (value === undefined) return 'normal';
  if (!isLatexBoardSize(value)) fail(`unsupported board size "${String(value)}"`);
  return value;
}

export function resolveFen(fen: unknown): string {
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

export function escapeLatex(text: string): string {
  return text
    .replace(CONTROL_CHARACTERS, '')
    .replace(/[\\&%$#_{}~^]/g, (char) => LATEX_ESCAPES[char] ?? char)
    .replace(/\r?\n/g, '\\\\ ');
}

export function cleanText(value: unknown, field: string): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') fail(`${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length > MAX_TEXT_LENGTH) {
    fail(`${field} exceeds ${MAX_TEXT_LENGTH} characters`);
  }
  return escapeLatex(trimmed);
}

export function pieceCounts(fen: string): { white: number; black: number } {
  let white = 0;
  let black = 0;
  for (const char of fenPlacementField(fen)) {
    if (/[KQRBNP]/.test(char)) white++;
    else if (/[kqrbnp]/.test(char)) black++;
  }
  return { white, black };
}

function hexDigits(color: string): string {
  return color.slice(1).toUpperCase();
}

export function colorName(color: string): string {
  return `cv${hexDigits(color)}`;
}

export function colorDefinition(color: string): string {
  return `\\definecolor{${colorName(color)}}{HTML}{${hexDigits(color)}}`;
}

interface MarkGroup {
  style: string;
  color: string;
  tint: boolean;
  key: 'markfields' | 'markmoves';
  items: string[];
}

function collectMarkGroups(position: LatexPosition): MarkGroup[] {
  const groups = new Map<string, MarkGroup>();

  const add = (
    key: MarkGroup['key'],
    style: string,
    color: string,
    tint: boolean,
    item: string
  ) => {
    const id = `${key}|${style}|${color}`;
    const group = groups.get(id) ?? { style, color, tint, key, items: [] };
    group.items.push(item);
    groups.set(id, group);
  };

  for (const highlight of position.highlights ?? []) {
    if (!isValidHighlight(highlight)) {
      fail(`invalid highlight "${String(highlight.square)}"`);
    }
    const ring = highlight.style === 'ring';
    add(
      'markfields',
      ring ? 'circle' : 'color',
      highlight.color ?? DEFAULT_HIGHLIGHT_COLOR,
      !ring,
      highlight.square
    );
  }

  for (const arrow of position.arrows ?? []) {
    if (!isValidArrow(arrow)) {
      fail(`invalid arrow "${String(arrow.from)}-${String(arrow.to)}"`);
    }
    add(
      'markmoves',
      'straightmove',
      arrow.color ?? DEFAULT_ARROW_COLOR,
      false,
      `${arrow.from}-${arrow.to}`
    );
  }

  return [...groups.values()];
}

export function positionColors(position: LatexPosition): string[] {
  return collectMarkGroups(position).map((group) => group.color);
}

function markKeys(position: LatexPosition): string[] {
  return collectMarkGroups(position).flatMap((group) => {
    const shade = group.tint
      ? `${colorName(group.color)}!${FILL_TINT_PERCENT}`
      : colorName(group.color);
    return [
      `pgfstyle=${group.style}`,
      `color=${shade}`,
      `${group.key}={${group.items.join(',')}}`,
    ];
  });
}

export interface BoardLineOptions {
  flipped: boolean;
  showCoords: boolean;
  showMover: boolean;
  size: LatexBoardSize;
}

export function skakLines(fen: string, options: BoardLineOptions): string[] {
  const { flipped, showCoords, size } = options;
  const lines = [`\\fenboard{${fen}}`];
  const resize = size !== 'normal';
  if (!showCoords) lines.push('\\notationoff');
  if (resize) lines.push(`\\${size}board`);
  lines.push(flipped ? '\\showinverseboard' : '\\showboard');
  if (resize) lines.push('\\normalboard');
  if (!showCoords) lines.push('\\notationon');
  return lines;
}

export function chessboardLines(
  fen: string,
  position: LatexPosition,
  options: BoardLineOptions
): string[] {
  const keys = [`setfen=${fen}`];
  if (options.flipped) keys.push('inverse=true');
  if (!options.showCoords) keys.push('label=false');
  if (!options.showMover) keys.push('showmover=false');
  if (options.size !== 'normal') {
    keys.push(`boardfontsize=${LATEX_BOARD_SIZE_PT[options.size]}pt`);
  }
  keys.push(...markKeys(position));

  if (keys.length === 1) return [`\\chessboard[${keys[0]}]`];

  const last = keys.length - 1;
  return [
    '\\chessboard[',
    ...keys.map((key, index) => `  ${key}${index === last ? '' : ','}`),
    ']',
  ];
}

function diagramAuthors(text: string): string {
  return text
    .split(';')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      if (name.includes(',')) return name;
      const parts = name.split(/\s+/);
      const surname = parts.pop() ?? name;
      return parts.length ? `${surname}, ${parts.join(' ')}` : `${surname}, `;
    })
    .join('; ');
}

export interface DiagramFields {
  author: string;
  source: string;
  award: string;
  stipulation: string;
  remark: string;
}

export function diagramLines(fen: string, fields: DiagramFields): string[] {
  const { white, black } = pieceCounts(fen);
  const lines = ['\\begin{diagram}'];
  if (fields.author) lines.push(`\\author{${diagramAuthors(fields.author)}}`);
  if (fields.source) lines.push(`\\source{${fields.source}}`);
  if (fields.award) lines.push(`\\award{${fields.award}}`);
  if (fields.remark) lines.push(`\\remark{${fields.remark}}`);
  if (fields.stipulation) lines.push(`\\stipulation{${fields.stipulation}}`);
  lines.push(
    `\\fen[${white}+${black}]{${fenPlacementField(fen)}}`,
    '\\end{diagram}'
  );
  return lines;
}
