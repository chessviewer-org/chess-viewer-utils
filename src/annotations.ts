import { squareToIndices } from './coordinates.js';
import { isValidHexColor } from './validation.js';

export interface SquareHighlight {
  square: string;
  color?: string;
  style?: 'fill' | 'ring';
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

export interface CheckIndicator {
  square: string;
  type?: 'check' | 'checkmate';
}

export interface BoardAnnotations {
  highlights?: SquareHighlight[];
  arrows?: Arrow[];
  check?: CheckIndicator;
}

const DEFAULT_HIGHLIGHT_COLOR = '#ffeb3b';
const DEFAULT_ARROW_COLOR = '#15781b';
const CHECK_COLOR = '#e8412c';

function isValidSquareName(square: string): boolean {
  return squareToIndices(square) !== null;
}

export function isValidHighlight(highlight: SquareHighlight): boolean {
  if (!isValidSquareName(highlight.square)) return false;
  if (highlight.color !== undefined && !isValidHexColor(highlight.color)) return false;
  if (highlight.style !== undefined && highlight.style !== 'fill' && highlight.style !== 'ring') return false;
  return true;
}

export function isValidArrow(arrow: Arrow): boolean {
  if (!isValidSquareName(arrow.from) || !isValidSquareName(arrow.to)) return false;
  if (arrow.from === arrow.to) return false;
  if (arrow.color !== undefined && !isValidHexColor(arrow.color)) return false;
  return true;
}

// sanitize
export function sanitizeAnnotations(annotations: BoardAnnotations): BoardAnnotations {
  const highlights = (annotations.highlights ?? []).filter(isValidHighlight);
  const arrows = (annotations.arrows ?? []).filter(isValidArrow);
  const check = annotations.check && isValidSquareName(annotations.check.square)
    ? annotations.check
    : undefined;

  const result: BoardAnnotations = {};
  if (highlights.length > 0) result.highlights = highlights;
  if (arrows.length > 0) result.arrows = arrows;
  if (check) result.check = check;
  return result;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface SquareToPixel {
  (square: string): { x: number; y: number } | null;
}

export function renderHighlightsSVG(
  highlights: SquareHighlight[],
  squareToPixel: SquareToPixel,
  squareSize: number
): string {
  const parts: string[] = [];
  for (const highlight of highlights) {
    if (!isValidHighlight(highlight)) continue;
    const origin = squareToPixel(highlight.square);
    if (!origin) continue;
    const color = highlight.color ?? DEFAULT_HIGHLIGHT_COLOR;
    const style = highlight.style ?? 'fill';
    if (style === 'ring') {
      const strokeW = Math.max(2, Math.round(squareSize * 0.06));
      const inset = strokeW / 2;
      parts.push(
        `<rect x="${origin.x + inset}" y="${origin.y + inset}" ` +
        `width="${squareSize - strokeW}" height="${squareSize - strokeW}" ` +
        `fill="none" stroke="${escapeXml(color)}" stroke-width="${strokeW}"/>`
      );
    } else {
      parts.push(
        `<rect x="${origin.x}" y="${origin.y}" width="${squareSize}" height="${squareSize}" ` +
        `fill="${escapeXml(color)}" fill-opacity="0.55"/>`
      );
    }
  }
  return parts.join('\n');
}

export function renderArrowsSVG(
  arrows: Arrow[],
  squareToPixel: SquareToPixel,
  squareSize: number
): string {
  const parts: string[] = [];
  let markerIndex = 0;
  for (const arrow of arrows) {
    if (!isValidArrow(arrow)) continue;
    const from = squareToPixel(arrow.from);
    const to = squareToPixel(arrow.to);
    if (!from || !to) continue;

    const color = arrow.color ?? DEFAULT_ARROW_COLOR;
    const markerId = `chess-arrowhead-${markerIndex++}`;
    const half = squareSize / 2;
    const x1 = from.x + half;
    const y1 = from.y + half;

    // shorten
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const shorten = half * 0.9;
    const x2 = to.x + half - (dx / length) * shorten;
    const y2 = to.y + half - (dy / length) * shorten;

    const strokeW = Math.max(2, Math.round(squareSize * 0.12));
    parts.push(
      `<marker id="${markerId}" markerWidth="4" markerHeight="4" refX="2" refY="2" ` +
      `orient="auto-start-reverse"><path d="M0,0 L4,2 L0,4 Z" fill="${escapeXml(color)}"/></marker>`
    );
    parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
      `stroke="${escapeXml(color)}" stroke-width="${strokeW}" stroke-opacity="0.8" ` +
      `marker-end="url(#${markerId})"/>`
    );
  }
  return parts.join('\n');
}

export function renderCheckIndicatorSVG(
  check: CheckIndicator,
  squareToPixel: SquareToPixel,
  squareSize: number
): string {
  if (!isValidSquareName(check.square)) return '';
  const origin = squareToPixel(check.square);
  if (!origin) return '';

  const cx = origin.x + squareSize / 2;
  const cy = origin.y + squareSize / 2;
  const r = squareSize * 0.65;
  const gradientId = `chess-check-glow-${check.square}`;
  const opacity = check.type === 'checkmate' ? 0.85 : 0.6;

  return [
    `<radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">`,
    `<stop offset="0%" stop-color="${CHECK_COLOR}" stop-opacity="${opacity}"/>`,
    `<stop offset="100%" stop-color="${CHECK_COLOR}" stop-opacity="0"/>`,
    `</radialGradient>`,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gradientId})"/>`,
  ].join('\n');
}
