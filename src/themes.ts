import { BOARD_THEMES, PIECE_SETS, PIECE_SET_POPULARITY, QUALITY_PRESETS, type BoardTheme, type PieceSet, type QualityPreset } from './constants.js';
import { bestTextColor, contrastRatio } from './colors.js';

export function getBoardTheme(id: string): BoardTheme | null {
  return BOARD_THEMES[id] ?? null;
}

export function listThemeIds(): string[] {
  return Object.keys(BOARD_THEMES);
}

export function getPieceSet(id: string): PieceSet | null {
  return PIECE_SETS.find((set) => set.id === id) ?? null;
}

export function pieceSetsByPopularity(): PieceSet[] {
  const rank = new Map(PIECE_SET_POPULARITY.map((id, i) => [id, i]));
  return [...PIECE_SETS].sort((a, b) => {
    const ra = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });
}

export function getQualityPreset(value: number): QualityPreset | null {
  return QUALITY_PRESETS.find((preset) => preset.value === value) ?? null;
}

export function themeContrast(theme: BoardTheme): number {
  return contrastRatio(theme.light, theme.dark);
}

export function themeCoordinateColor(theme: BoardTheme): 'white' | 'black' {
  return bestTextColor(theme.dark);
}
