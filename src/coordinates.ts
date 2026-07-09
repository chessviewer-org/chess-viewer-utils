export interface CoordinateParams {
  fontSize: number;
  borderSize: number;
  fontWeight: number;
  offset: number;
}

export interface SquareBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function getCoordinateParams(boardSize: number): CoordinateParams {
  const borderSize = Math.round(Math.max(18, Math.min(800, boardSize * 0.05)));
  const fontSize = Math.round(Math.max(10, Math.min(480, borderSize * 0.72)));
  return { fontSize, borderSize, fontWeight: 600, offset: Math.round(borderSize / 2) };
}

export function getSquareBounds(
  rowIndex: number,
  colIndex: number,
  squareSize: number,
  offsetX = 0,
  offsetY = 0
): SquareBounds {
  const x0 = Math.round(offsetX + colIndex * squareSize);
  const x1 = Math.round(offsetX + (colIndex + 1) * squareSize);
  const y0 = Math.round(offsetY + rowIndex * squareSize);
  const y1 = Math.round(offsetY + (rowIndex + 1) * squareSize);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, centerX: Math.round((x0 + x1) / 2), centerY: Math.round((y0 + y1) / 2) };
}

export function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

export function getDisplayCoordinates(row: number, col: number, flipped: boolean): [number, number] {
  return [flipped ? 7 - row : row, flipped ? 7 - col : col];
}

export function squareToIndices(square: string): [number, number] | null {
  if (square.length !== 2) return null;
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1] ?? '', 10);
  if (file < 0 || file > 7 || isNaN(rank) || rank < 1 || rank > 8) return null;
  return [8 - rank, file];
}

export function indicesToSquare(row: number, col: number): string {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}
