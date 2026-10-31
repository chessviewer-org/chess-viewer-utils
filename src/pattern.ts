export type SquarePattern = 'solid' | 'hatched';

export const SQUARE_PATTERNS: readonly SquarePattern[] = ['solid', 'hatched'];

export const HATCH_DIVISIONS = 10;
export const HATCH_LINE_RATIO = 0.28;
export const PIECE_HALO_RATIO = 0.035;
export const BOARD_OUTLINE_RATIO = 1 / 192;

export type HatchSegment = [x1: number, y1: number, x2: number, y2: number];

export function isSquarePattern(value: unknown): value is SquarePattern {
  return value === 'solid' || value === 'hatched';
}

export function boardOutlineWidth(boardSize: number): number {
  return Math.max(1, Math.round(boardSize * BOARD_OUTLINE_RATIO));
}

export function pieceHaloRadius(squareSize: number): number {
  return squareSize * PIECE_HALO_RATIO;
}

export function hatchLineWidth(squareSize: number): number {
  return (squareSize / HATCH_DIVISIONS / Math.SQRT2) * HATCH_LINE_RATIO;
}

export function hatchSegments(squareSize: number): HatchSegment[] {
  const step = squareSize / HATCH_DIVISIONS;
  const segments: HatchSegment[] = [];
  for (let k = 0; k <= HATCH_DIVISIONS * 2; k++) {
    const c = k * step;
    segments.push([c + step, -step, -step, c + step]);
  }
  return segments;
}

export function hatchBoardPath(
  originX: number,
  originY: number,
  squareSize: number
): string {
  const step = squareSize / HATCH_DIVISIONS;
  const parts: string[] = [];
  for (let k = 0; k <= HATCH_DIVISIONS * 16; k++) {
    const c = k * step;
    parts.push(
      `M${originX + c + step},${originY - step}L${originX - step},${originY + c + step}`
    );
  }
  return parts.join('');
}

export function hatchPatternSVG(
  id: string,
  squareSize: number,
  originX: number,
  originY: number,
  color: string
): string {
  const q = squareSize / HATCH_DIVISIONS;
  const d = [0, 1, 2].map((k) => `M${k * q + q},${-q}L${-q},${k * q + q}`).join('');
  return (
    `<pattern id="${id}" patternUnits="userSpaceOnUse" ` +
    `x="${originX}" y="${originY}" width="${q}" height="${q}">` +
    `<path d="${d}" stroke="${color}" stroke-width="${hatchLineWidth(squareSize)}" fill="none"/>` +
    `</pattern>`
  );
}

export function pieceHaloFilterSVG(id: string, radius: number, color: string): string {
  return (
    `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feMorphology in="SourceAlpha" operator="dilate" radius="${radius}" result="spread"/>` +
    `<feFlood flood-color="${color}"/>` +
    `<feComposite in2="spread" operator="in" result="halo"/>` +
    `<feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>`
  );
}
