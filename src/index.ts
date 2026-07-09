export {
  parseFEN,
  validateFEN,
  getFENValidationError,
  validateFENDetailed,
  createEmptyBoard,
  boardToFEN,
  isBoardEmpty,
  pieceToName,
  describeBoardPosition,
  FENParseError,
  MAX_FEN_LENGTH,
  type PieceSymbol,
  type BoardMatrix,
  type ValidationResult,
} from './fen.js';

export {
  parseFENRecord,
  buildFENRecord,
  toggleActiveColor,
  fenPlacementField,
  normalizeFEN,
  type FENRecord,
  type ActiveColor,
} from './fen-record.js';

export {
  cloneBoard,
  getPieceAt,
  setPieceAt,
  removePieceAt,
  movePiece,
  flipBoard,
  listPieces,
  countPieces,
  materialBalance,
  findKing,
  hasBothKings,
  type SquareRef,
  type PiecePlacement,
} from './board.js';

export { generateDiagram, type DiagramOptions } from './svg.js';

export {
  renderHighlightsSVG,
  renderArrowsSVG,
  renderCheckIndicatorSVG,
  sanitizeAnnotations,
  isValidHighlight,
  isValidArrow,
  type SquareHighlight,
  type Arrow,
  type CheckIndicator,
  type BoardAnnotations,
} from './annotations.js';

export {
  pointToSquare,
  squareToPoint,
  applyDragMove,
  applyDragRemove,
  applyPaletteDrop,
  resolveClick,
  type BoardPoint,
  type HitTestOptions,
  type DragMoveResult,
  type ClickResolution,
} from './interaction.js';

export { PIECES, getPieceSVG } from './pieces.js';

export {
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  hexToHsv,
  hsvToHex,
  relativeLuminance,
  contrastRatio,
  bestTextColor,
} from './colors.js';

export {
  safeJSONParse,
  sanitizeFileName,
  isValidHexColor,
  sanitizeHexColor,
  sanitizeInput,
  isRecord,
} from './validation.js';

export {
  DEFAULT_LIGHT_SQUARE,
  DEFAULT_DARK_SQUARE,
  STARTING_FEN,
  EMPTY_FEN,
  PIECE_SETS,
  PIECE_SET_POPULARITY,
  BOARD_THEMES,
  QUALITY_PRESETS,
  PIECE_MAP,
  type PieceSet,
  type BoardTheme,
  type QualityPreset,
} from './constants.js';

export {
  calculateStatus,
  createHistoryEntry,
  touchEntry,
  sortByMostRecent,
  sortArchivedByArchiveDate,
  mergeById,
  applyFilters,
  partitionByArchiveStatus,
  convertToArchivedEntry,
  type HistorySource,
  type ArchiveSource,
  type FreshnessStatus,
  type BaseHistoryEntry,
  type ActiveHistoryEntry,
  type ArchivedHistoryEntry,
  type HistoryFilters,
  type PartitionResult,
} from './history.js';

export {
  getCoordinateParams,
  getSquareBounds,
  isLightSquare,
  getDisplayCoordinates,
  squareToIndices,
  indicesToSquare,
  type CoordinateParams,
  type SquareBounds,
} from './coordinates.js';

export { changeDPI } from './dpi.js';

export {
  getBoardTheme,
  listThemeIds,
  getPieceSet,
  pieceSetsByPopularity,
  getQualityPreset,
  themeContrast,
  themeCoordinateColor,
} from './themes.js';

export {
  readImageDimensions,
  physicalSize,
  type ImageDimensions,
} from './image.js';
