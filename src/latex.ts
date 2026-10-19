import {
  type LatexPosition,
  fail,
} from './latex-core.js';
import {
  type LatexLayoutOptions,
  generateLatexDocument,
} from './latex-document.js';

export {
  LATEX_BOARD_SIZES,
  LATEX_BOARD_SIZE_PT,
  LATEX_DIAGRAM_SIZE_PT,
  LATEX_PACKAGES,
  LATEX_PACKAGE_META,
  escapeLatex,
  isLatexBoardSize,
  isLatexPackage,
  pieceCounts,
  type LatexBoardSize,
  type LatexOutputMode,
  type LatexPackage,
  type LatexPackageMeta,
  type LatexPosition,
} from './latex-core.js';

export {
  LATEX_COLUMN_RANGE,
  LATEX_DOCUMENT_CLASSES,
  LATEX_FONT_SIZES,
  LATEX_MARGIN_RANGE_MM,
  LATEX_MAX_POSITIONS,
  LATEX_PAPER_SIZES,
  generateLatexDocument,
  type LatexDocumentClass,
  type LatexDocumentConfig,
  type LatexFontSize,
  type LatexLayoutOptions,
  type LatexPaperSize,
} from './latex-document.js';

export interface LatexExportConfig extends LatexPosition, LatexLayoutOptions {}

export function generateBoardLatex(config: LatexExportConfig): string {
  if (!config) fail('config is null or undefined');
  return generateLatexDocument({ ...config, positions: [config] });
}
