import { parseFEN, type BoardMatrix } from './fen.js';
import { getPieceSVG } from './pieces.js';

export interface DiagramOptions {
  /** FEN string (piece placement only or full FEN) */
  fen: string;
  /** Light square color (hex, default '#f0d9b5') */
  lightSquare?: string;
  /** Dark square color (hex, default '#b58863') */
  darkSquare?: string;
  /** Board size in pixels (default 400) */
  size?: number;
  /** Whether to show rank/file coordinates (default false) */
  showCoords?: boolean;
  /** Whether to flip the board (black at bottom, default false) */
  flipped?: boolean;
  /** Whether to show a thin outer frame (default false) */
  showFrame?: boolean;
  /**
   * Color of the rank/file coordinate labels. Accepts a hex string or the
   * names `'white'` / `'black'` (e.g. the result of `themeCoordinateColor`).
   * Default '#000000'.
   */
  coordColor?: string;
  /** Accessible label for the SVG (default 'Chess position') */
  label?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function safeColor(color: string | undefined, fallback: string): string {
  if (color && isValidHexColor(color)) return color;
  return fallback;
}

/**
 * Resolves a coordinate color. Accepts a hex string or the convenience names
 * `'white'` / `'black'` (as returned by `themeCoordinateColor`).
 */
function resolveCoordColor(color: string | undefined, fallback: string): string {
  if (color === 'white') return '#ffffff';
  if (color === 'black') return '#000000';
  return safeColor(color, fallback);
}

/**
 * Generates a self-contained SVG chess diagram from a FEN string.
 * Works in Node.js and browsers — no DOM required.
 *
 * @param options - Diagram configuration
 * @returns SVG markup string
 * @throws If the FEN string is invalid
 */
export function generateDiagram(options: DiagramOptions): string {
  const {
    fen,
    size = 400,
    showCoords = false,
    flipped = false,
    showFrame = false,
    label = 'Chess position',
  } = options;

  const lightSquare = safeColor(options.lightSquare, '#f0d9b5');
  const darkSquare = safeColor(options.darkSquare, '#b58863');
  const coordColor = resolveCoordColor(options.coordColor, '#000000');

  const board: BoardMatrix = parseFEN(fen);

  const COORD_RATIO = 0.05;
  const coordBorder = showCoords ? Math.round(Math.max(18, size * COORD_RATIO)) : 0;
  const frameThickness = showFrame ? Math.max(2, Math.round(size * 0.003)) : 0;
  const framePadding = showFrame ? frameThickness * 2 : 0;

  const totalWidth = coordBorder + size + framePadding;
  const totalHeight = size + coordBorder + framePadding;
  const boardX = coordBorder + (showFrame ? frameThickness : 0);
  const boardY = showFrame ? frameThickness : 0;
  const squareSize = size / 8;

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${totalWidth} ${totalHeight}" ` +
    `width="${totalWidth}" height="${totalHeight}" ` +
    `role="img" aria-label="${escapeXml(label)}">`
  );
  parts.push(`<title>${escapeXml(label)}</title>`);

  if (showFrame) {
    const f = frameThickness;
    parts.push(
      `<rect x="0" y="0" width="${totalWidth}" height="${f}" fill="#333333"/>`,
      `<rect x="0" y="${totalHeight - f}" width="${totalWidth}" height="${f}" fill="#333333"/>`,
      `<rect x="0" y="0" width="${f}" height="${totalHeight}" fill="#333333"/>`,
      `<rect x="${totalWidth - f}" y="0" width="${f}" height="${totalHeight}" fill="#333333"/>`
    );
  }

  const strokeW = Math.max(1, Math.round(size * 0.002));
  const half = strokeW / 2;
  parts.push(
    `<rect x="${boardX - half}" y="${boardY - half}" ` +
    `width="${size + strokeW}" height="${size + strokeW}" ` +
    `fill="none" stroke="#000000" stroke-width="${strokeW}"/>`
  );

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const visRow = flipped ? 7 - row : row;
      const visCol = flipped ? 7 - col : col;
      const color = (row + col) % 2 === 0 ? lightSquare : darkSquare;
      const x = boardX + visCol * squareSize;
      const y = boardY + visRow * squareSize;
      parts.push(
        `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${escapeXml(color)}"/>`
      );
    }
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const fenPiece = board[row]?.[col];
      if (!fenPiece) continue;

      const pieceSvg = getPieceSVG(fenPiece);
      if (!pieceSvg) continue;

      const visRow = flipped ? 7 - row : row;
      const visCol = flipped ? 7 - col : col;
      const x = boardX + visCol * squareSize;
      const y = boardY + visRow * squareSize;

      const innerContent = pieceSvg
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '');

      parts.push(
        `<g transform="translate(${x},${y}) scale(${squareSize / 45})">${innerContent}</g>`
      );
    }
  }

  if (showCoords) {
    const files = flipped
      ? ['h','g','f','e','d','c','b','a']
      : ['a','b','c','d','e','f','g','h'];
    const ranks = flipped
      ? ['1','2','3','4','5','6','7','8']
      : ['8','7','6','5','4','3','2','1'];

    const fontSize = Math.round(Math.max(10, coordBorder * 0.72));
    const fontFamily = "'Inter', system-ui, sans-serif";
    const textAttrs = `font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="600" fill="${escapeXml(coordColor)}" text-anchor="middle"`;

    for (let col = 0; col < 8; col++) {
      const x = boardX + col * squareSize + squareSize / 2;
      const y = boardY + size + coordBorder * 0.7;
      parts.push(`<text x="${x}" y="${y}" ${textAttrs}>${files[col]}</text>`);
    }

    for (let row = 0; row < 8; row++) {
      const frameOffset = showFrame ? frameThickness : 0;
      const x = frameOffset + coordBorder * 0.5;
      const y = boardY + row * squareSize + squareSize / 2 + fontSize * 0.35;
      parts.push(`<text x="${x}" y="${y}" ${textAttrs}>${ranks[row]}</text>`);
    }
  }

  parts.push('</svg>');
  return parts.join('\n');
}
