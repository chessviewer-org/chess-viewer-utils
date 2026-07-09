import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseFEN, validateFEN, validateFENDetailed, getFENValidationError,
  boardToFEN, createEmptyBoard, isBoardEmpty, describeBoardPosition,
  FENParseError, pieceToName,
} from './fen.ts';
import { generateDiagram } from './svg.ts';
import { getPieceSVG } from './pieces.ts';
import {
  hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, hexToHsv, hsvToHex,
  relativeLuminance, contrastRatio, bestTextColor,
} from './colors.ts';
import {
  safeJSONParse, sanitizeFileName, isValidHexColor, sanitizeHexColor, sanitizeInput,
} from './validation.ts';
import {
  DEFAULT_LIGHT_SQUARE, DEFAULT_DARK_SQUARE, STARTING_FEN, EMPTY_FEN,
  BOARD_THEMES, QUALITY_PRESETS, PIECE_SETS, PIECE_SET_POPULARITY,
} from './constants.ts';
import {
  calculateStatus, createHistoryEntry, touchEntry, sortByMostRecent,
  mergeById, applyFilters, partitionByArchiveStatus, convertToArchivedEntry,
  sortArchivedByArchiveDate,
} from './history.ts';
import {
  getCoordinateParams, getSquareBounds, isLightSquare, squareToIndices, indicesToSquare,
} from './coordinates.ts';
import {
  parseFENRecord, buildFENRecord, toggleActiveColor, fenPlacementField, normalizeFEN,
} from './fen-record.ts';
import {
  cloneBoard, getPieceAt, setPieceAt, removePieceAt, movePiece, flipBoard,
  listPieces, countPieces, materialBalance, findKing, hasBothKings,
} from './board.ts';
import {
  getBoardTheme, listThemeIds, getPieceSet, pieceSetsByPopularity,
  getQualityPreset, themeContrast, themeCoordinateColor,
} from './themes.ts';
import { readImageDimensions, physicalSize } from './image.ts';
import {
  renderHighlightsSVG, renderArrowsSVG, renderCheckIndicatorSVG,
  sanitizeAnnotations, isValidHighlight, isValidArrow,
} from './annotations.ts';
import {
  pointToSquare, squareToPoint, applyDragMove, applyDragRemove,
  applyPaletteDrop, resolveClick,
} from './interaction.ts';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const START_POS = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';


test('parseFEN: starting position', () => {
  const b = parseFEN(START_FEN);
  assert.equal(b.length, 8);
  assert.equal(b[0]?.length, 8);
  assert.equal(b[0]?.[0], 'r');
  assert.equal(b[0]?.[4], 'k');
  assert.equal(b[7]?.[4], 'K');
});

test('parseFEN: piece-placement-only FEN', () => {
  const b = parseFEN(START_POS);
  assert.equal(b[1]?.[0], 'p');
  assert.equal(b[6]?.[0], 'P');
});

test('parseFEN: empty squares filled with empty string', () => {
  const b = parseFEN(START_FEN);
  assert.equal(b[2]?.[0], '');
  assert.equal(b[3]?.[3], '');
});

test('parseFEN: throws FENParseError on bad input', () => {
  assert.throws(() => parseFEN('bad'), FENParseError);
  assert.throws(() => parseFEN(''), FENParseError);
  assert.throws(() => parseFEN('8/8/8/8/8/8/8/9'), FENParseError);
  assert.throws(() => parseFEN('8/8/8/8/8/8/8'), FENParseError);
});

test('validateFEN: valid', () => {
  assert.equal(validateFEN(START_FEN), true);
  assert.equal(validateFEN(START_POS), true);
});

test('validateFEN: invalid', () => {
  assert.equal(validateFEN(''), false);
  assert.equal(validateFEN('bad-fen'), false);
});

test('getFENValidationError: empty on valid', () => {
  assert.equal(getFENValidationError(START_FEN), '');
});

test('getFENValidationError: returns message for invalid char', () => {
  const err = getFENValidationError('rnbXkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  assert.ok(err.length > 0);
});

test('validateFENDetailed: full FEN valid', () => {
  const r = validateFENDetailed(START_FEN);
  assert.equal(r.isValid, true);
  assert.equal(r.errorMessage, null);
});

test('validateFENDetailed: 6-part requirement', () => {
  const r = validateFENDetailed(START_POS);
  assert.equal(r.isValid, false);
  assert.ok(r.errorMessage?.includes('6 parts'));
});

test('validateFENDetailed: invalid active color', () => {
  assert.equal(validateFENDetailed('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1').isValid, false);
});

test('validateFENDetailed: invalid en passant', () => {
  assert.equal(validateFENDetailed('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq z5 0 1').isValid, false);
});

test('boardToFEN: round-trip', () => {
  assert.equal(boardToFEN(parseFEN(START_FEN)), START_POS);
});

test('createEmptyBoard', () => {
  const b = createEmptyBoard();
  assert.equal(b.length, 8);
  assert.ok(b.every(r => r.every(c => c === '')));
});

test('isBoardEmpty', () => {
  assert.equal(isBoardEmpty(createEmptyBoard()), true);
  assert.equal(isBoardEmpty(parseFEN(START_FEN)), false);
});

test('describeBoardPosition: has white/black sections', () => {
  const desc = describeBoardPosition(parseFEN(START_FEN));
  assert.ok(desc.includes('White:'));
  assert.ok(desc.includes('Black:'));
});

test('describeBoardPosition: empty board', () => {
  assert.equal(describeBoardPosition(createEmptyBoard()), 'Empty board');
});

test('pieceToName', () => {
  assert.equal(pieceToName('K'), 'white king');
  assert.equal(pieceToName('k'), 'black king');
  assert.equal(pieceToName('P'), 'white pawn');
  assert.equal(pieceToName('?'), '?');
});


test('getPieceSVG: all 12 pieces return SVG', () => {
  for (const p of ['P','N','B','R','Q','K','p','n','b','r','q','k']) {
    const svg = getPieceSVG(p);
    assert.ok(svg?.includes('<svg'), `Missing SVG for '${p}'`);
  }
});

test('getPieceSVG: null for invalid', () => {
  assert.equal(getPieceSVG('X'), null);
  assert.equal(getPieceSVG(''), null);
});


test('generateDiagram: valid SVG', () => {
  const svg = generateDiagram({ fen: START_FEN });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('viewBox'));
});

test('generateDiagram: piece-placement-only FEN', () => {
  const svg = generateDiagram({ fen: START_POS, size: 300 });
  assert.ok(svg.includes('width="300"'));
});

test('generateDiagram: with coordinates', () => {
  const svg = generateDiagram({ fen: START_FEN, showCoords: true });
  assert.ok(svg.includes('<text'));
  assert.ok(svg.includes('>a<'));
  assert.ok(svg.includes('>8<'));
});

test('generateDiagram: flipped changes layout', () => {
  assert.notEqual(generateDiagram({ fen: START_FEN }), generateDiagram({ fen: START_FEN, flipped: true }));
});

test('generateDiagram: custom colors', () => {
  const svg = generateDiagram({ fen: START_FEN, lightSquare: '#ffffff', darkSquare: '#000000' });
  assert.ok(svg.includes('#ffffff'));
  assert.ok(svg.includes('#000000'));
});

test('generateDiagram: with frame', () => {
  const svg = generateDiagram({ fen: START_FEN, showFrame: true });
  assert.ok(svg.includes('#333333'));
});

test('generateDiagram: throws on invalid FEN', () => {
  assert.throws(() => generateDiagram({ fen: 'invalid' }), FENParseError);
});

test('generateDiagram: XSS-safe label', () => {
  const svg = generateDiagram({ fen: START_FEN, label: '<script>alert(1)</script>' });
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&lt;script&gt;'));
});

test('generateDiagram: invalid color falls back to default', () => {
  const svg = generateDiagram({ fen: START_FEN, lightSquare: 'not-a-color' });
  assert.ok(svg.includes('#f0d9b5'));
});

test('generateDiagram: coordinate color is configurable', () => {
  const svg = generateDiagram({ fen: START_FEN, showCoords: true, coordColor: '#ffffff' });
  assert.ok(svg.includes('fill="#ffffff"'));
});

test('generateDiagram: coordinate color defaults to black', () => {
  const svg = generateDiagram({ fen: START_FEN, showCoords: true });
  assert.ok(svg.includes('fill="#000000"'));
});

test('generateDiagram: invalid coordinate color falls back to black', () => {
  const svg = generateDiagram({ fen: START_FEN, showCoords: true, coordColor: 'nope' });
  assert.ok(svg.includes('fill="#000000"'));
});

test('generateDiagram: inner coordinate style draws labels without a border', () => {
  const bordered = generateDiagram({ fen: START_FEN, showCoords: true, coordStyle: 'border' });
  const inner = generateDiagram({ fen: START_FEN, showCoords: true, coordStyle: 'inner' });
  assert.ok(inner.includes('>a<'));
  assert.ok(inner.includes('>8<'));
  assert.notEqual(bordered, inner);
  const innerWidthMatch = inner.match(/width="(\d+)"/);
  assert.equal(innerWidthMatch?.[1], '400');
});

test('generateDiagram: inner coordinates default to border style', () => {
  const withoutStyle = generateDiagram({ fen: START_FEN, showCoords: true });
  const withBorderStyle = generateDiagram({ fen: START_FEN, showCoords: true, coordStyle: 'border' });
  assert.equal(withoutStyle, withBorderStyle);
});

test('generateDiagram: coordColor accepts "white"/"black" names', () => {
  const white = generateDiagram({ fen: START_FEN, showCoords: true, coordColor: 'white' });
  assert.ok(white.includes('fill="#ffffff"'));
  const black = generateDiagram({ fen: START_FEN, showCoords: true, coordColor: 'black' });
  assert.ok(black.includes('fill="#000000"'));
});


test('hexToRgb: known values', () => {
  assert.deepEqual(hexToRgb('#ff0000'), { r: 255, g: 0, b: 0 });
  assert.deepEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0 });
  assert.deepEqual(hexToRgb('#ffffff'), { r: 255, g: 255, b: 255 });
});

test('hexToRgb: invalid returns zeros', () => {
  assert.deepEqual(hexToRgb('bad'), { r: 0, g: 0, b: 0 });
});

test('rgbToHex: round-trip', () => {
  assert.equal(rgbToHex(255, 0, 0), '#ff0000');
  assert.equal(rgbToHex(0, 0, 0), '#000000');
});

test('rgbToHsv / hsvToRgb: round-trip', () => {
  const { h, s, v } = rgbToHsv(255, 128, 0);
  const { r, g, b } = hsvToRgb(h, s, v);
  assert.ok(Math.abs(r - 255) <= 1);
  assert.ok(Math.abs(g - 128) <= 1);
  assert.ok(Math.abs(b - 0) <= 1);
});

test('hexToHsv / hsvToHex: round-trip', () => {
  const color = '#b58863';
  const { h, s, v } = hexToHsv(color);
  assert.equal(hsvToHex(h, s, v), color);
});

test('relativeLuminance: black=0, white=1', () => {
  assert.ok(Math.abs(relativeLuminance('#000000') - 0) < 0.001);
  assert.ok(Math.abs(relativeLuminance('#ffffff') - 1) < 0.001);
});

test('contrastRatio: black/white = 21', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.1);
});

test('contrastRatio: same color = 1', () => {
  assert.ok(Math.abs(contrastRatio('#aabbcc', '#aabbcc') - 1) < 0.01);
});

test('bestTextColor: dark bg → white, light bg → black', () => {
  assert.equal(bestTextColor('#000000'), 'white');
  assert.equal(bestTextColor('#ffffff'), 'black');
});


test('safeJSONParse: valid', () => {
  assert.deepEqual(safeJSONParse<{a:number}>('{"a":1}', {a:0}), {a:1});
});

test('safeJSONParse: invalid falls back', () => {
  assert.deepEqual(safeJSONParse('{{bad}}', 42), 42);
});

test('safeJSONParse: prototype pollution blocked', () => {
  const r = safeJSONParse<Record<string,unknown>>('{"__proto__":{"evil":true}}', {});
  // dropped
  assert.equal(Object.prototype.hasOwnProperty.call(r, '__proto__'), false);
  // not poisoned
  assert.equal(({} as Record<string,unknown>)['evil'], undefined);
});

test('sanitizeFileName: removes unsafe chars', () => {
  assert.equal(sanitizeFileName('file<name>'), 'file-name-');
  assert.equal(sanitizeFileName(''), 'chess-position');
  assert.equal(sanitizeFileName(null), 'chess-position');
});

test('sanitizeFileName: trims to 100 chars', () => {
  const long = 'a'.repeat(200);
  assert.equal(sanitizeFileName(long).length, 100);
});

test('isValidHexColor', () => {
  assert.equal(isValidHexColor('#f0d9b5'), true);
  assert.equal(isValidHexColor('#FFF'), false);
  assert.equal(isValidHexColor('red'), false);
  assert.equal(isValidHexColor(''), false);
});

test('sanitizeHexColor: fallback on invalid', () => {
  assert.equal(sanitizeHexColor('bad', '#aabbcc'), '#aabbcc');
  assert.equal(sanitizeHexColor('#123456'), '#123456');
});

test('sanitizeInput: escapes HTML', () => {
  assert.equal(sanitizeInput('<b>bold</b>'), '&lt;b&gt;bold&lt;&#x2F;b&gt;');
});


test('constants: defaults and collections', () => {
  assert.equal(DEFAULT_LIGHT_SQUARE, '#f0d9b5');
  assert.equal(DEFAULT_DARK_SQUARE, '#b58863');
  assert.equal(STARTING_FEN, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.equal(EMPTY_FEN, '8/8/8/8/8/8/8/8 w - - 0 1');
  assert.ok(PIECE_SETS.length > 0);
  assert.ok(PIECE_SET_POPULARITY.length === PIECE_SETS.length);
  assert.ok(Object.keys(BOARD_THEMES).length > 0);
  assert.ok(QUALITY_PRESETS.length === 4);
});

test('BOARD_THEMES: each has name/light/dark', () => {
  for (const [id, theme] of Object.entries(BOARD_THEMES)) {
    assert.ok(theme.name.length > 0, `${id} missing name`);
    assert.ok(isValidHexColor(theme.light), `${id} light not hex`);
    assert.ok(isValidHexColor(theme.dark), `${id} dark not hex`);
  }
});

test('QUALITY_PRESETS: valid structure', () => {
  for (const p of QUALITY_PRESETS) {
    assert.ok(p.value >= 1);
    assert.ok(p.label.length > 0);
    assert.ok(p.mode === 'print' || p.mode === 'social');
  }
});


test('createHistoryEntry: shape', () => {
  const e = createHistoryEntry(START_FEN, 'manual');
  assert.equal(e.fen, START_FEN);
  assert.equal(e.source, 'manual');
  assert.equal(e.isFavorite, false);
  assert.ok(typeof e.id === 'number');
});

test('calculateStatus: green for recent', () => {
  assert.equal(calculateStatus(Date.now()), 'green');
});

test('calculateStatus: red for old', () => {
  assert.equal(calculateStatus(Date.now() - 91 * 24 * 60 * 60 * 1000), 'red');
});

test('touchEntry: updates lastActiveAt', () => {
  const e = createHistoryEntry(START_FEN, 'manual');
  const before = e.lastActiveAt;
  const touched = touchEntry(e);
  assert.ok(touched.lastActiveAt >= before);
});

test('sortByMostRecent: orders correctly', () => {
  const a = createHistoryEntry(START_FEN, 'manual');
  const b = { ...a, id: a.id + 1, lastActiveAt: a.lastActiveAt + 1000 };
  const sorted = sortByMostRecent([a, b]);
  assert.equal(sorted[0]!.id, b.id);
});

test('mergeById: primary wins collisions', () => {
  const a = { id: 1, val: 'primary' };
  const b = { id: 1, val: 'secondary' };
  const merged = mergeById([a], [b]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]!.val, 'primary');
});

test('mergeById: combines unique entries', () => {
  const a = { id: 1 }, b = { id: 2 };
  assert.equal(mergeById([a], [b]).length, 2);
});

test('applyFilters: fenSearch', () => {
  const e1 = createHistoryEntry('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'manual');
  const e2 = createHistoryEntry('4k3/8/8/8/8/8/8/4K3 w - - 0 1', 'manual');
  const r = applyFilters([e1, e2], { fenSearch: '4k3' });
  assert.equal(r.length, 1);
  assert.equal(r[0]!.fen, e2.fen);
});

test('applyFilters: favoritesOnly', () => {
  const e1 = createHistoryEntry(START_FEN, 'manual');
  const e2 = { ...e1, id: e1.id + 1, isFavorite: true };
  const r = applyFilters([e1, e2], { favoritesOnly: true });
  assert.equal(r.length, 1);
  assert.equal(r[0]!.isFavorite, true);
});

test('applyFilters: source', () => {
  const e1 = createHistoryEntry(START_FEN, 'manual');
  const e2 = createHistoryEntry(START_FEN, 'export');
  assert.equal(applyFilters([e1, e2], { source: 'export' }).length, 1);
});

test('partitionByArchiveStatus: favorites stay active', () => {
  const e = { ...createHistoryEntry(START_FEN, 'manual'), isFavorite: true, lastActiveAt: 0 };
  const { active, toArchive } = partitionByArchiveStatus([e]);
  assert.equal(active.length, 1);
  assert.equal(toArchive.length, 0);
});

test('partitionByArchiveStatus: old non-favorite archives', () => {
  const old = { ...createHistoryEntry(START_FEN, 'manual'), lastActiveAt: Date.now() - 100 * 24 * 60 * 60 * 1000 };
  const { toArchive } = partitionByArchiveStatus([old]);
  assert.equal(toArchive.length, 1);
});

test('convertToArchivedEntry: shape', () => {
  const e = createHistoryEntry(START_FEN, 'manual');
  const archived = convertToArchivedEntry(e, 'manual');
  assert.equal(archived.fen, e.fen);
  assert.equal(archived.archiveSource, 'manual');
  assert.ok(typeof archived.archivedAt === 'number');
});

test('sortArchivedByArchiveDate: newest first', () => {
  const e1 = convertToArchivedEntry(createHistoryEntry(START_FEN, 'manual'));
  const e2 = { ...e1, id: e1.id + 1, archivedAt: e1.archivedAt + 1000 };
  const sorted = sortArchivedByArchiveDate([e1, e2]);
  assert.equal(sorted[0]!.id, e2.id);
});


test('getCoordinateParams: minimum font size', () => {
  const p = getCoordinateParams(400);
  assert.ok(p.fontSize >= 10);
  assert.ok(p.borderSize >= 18);
});

test('getSquareBounds: correct position', () => {
  const b = getSquareBounds(0, 0, 50);
  assert.equal(b.x, 0);
  assert.equal(b.y, 0);
  assert.equal(b.width, 50);
  assert.equal(b.height, 50);
  assert.equal(b.centerX, 25);
  assert.equal(b.centerY, 25);
});

test('getSquareBounds: with offset', () => {
  const b = getSquareBounds(1, 2, 50, 10, 20);
  assert.equal(b.x, 10 + 2 * 50);
  assert.equal(b.y, 20 + 1 * 50);
});

test('isLightSquare: a1 is dark (row7,col0)', () => {
  assert.equal(isLightSquare(7, 0), false);
  assert.equal(isLightSquare(0, 0), true);
});

test('squareToIndices: e4', () => {
  const r = squareToIndices('e4');
  assert.deepEqual(r, [4, 4]);
});

test('squareToIndices: a8', () => {
  assert.deepEqual(squareToIndices('a8'), [0, 0]);
});

test('squareToIndices: h1', () => {
  assert.deepEqual(squareToIndices('h1'), [7, 7]);
});

test('squareToIndices: invalid returns null', () => {
  assert.equal(squareToIndices('z9'), null);
  assert.equal(squareToIndices(''), null);
});

test('indicesToSquare: round-trip', () => {
  assert.equal(indicesToSquare(4, 4), 'e4');
  assert.equal(indicesToSquare(0, 0), 'a8');
  assert.equal(indicesToSquare(7, 7), 'h1');
});


test('parseFENRecord: full starting record', () => {
  const r = parseFENRecord(START_FEN);
  assert.equal(r.activeColor, 'w');
  assert.equal(r.castling, 'KQkq');
  assert.equal(r.enPassant, '-');
  assert.equal(r.halfmove, 0);
  assert.equal(r.fullmove, 1);
  assert.equal(r.board[0]?.[0], 'r');
});

test('parseFENRecord: defaults for placement-only string', () => {
  const r = parseFENRecord(START_POS);
  assert.equal(r.activeColor, 'w');
  assert.equal(r.castling, '-');
  assert.equal(r.enPassant, '-');
  assert.equal(r.halfmove, 0);
  assert.equal(r.fullmove, 1);
});

test('parseFENRecord: parses en passant and clocks', () => {
  const r = parseFENRecord('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 5 12');
  assert.equal(r.activeColor, 'b');
  assert.equal(r.enPassant, 'e3');
  assert.equal(r.halfmove, 5);
  assert.equal(r.fullmove, 12);
});

test('parseFENRecord: rejects bad active color', () => {
  assert.throws(() => parseFENRecord('8/8/8/8/8/8/8/8 x - - 0 1'), FENParseError);
});

test('parseFENRecord: rejects duplicate castling rights', () => {
  assert.throws(() => parseFENRecord('8/8/8/8/8/8/8/8 w KK - 0 1'), FENParseError);
});

test('parseFENRecord: rejects bad en passant square', () => {
  assert.throws(() => parseFENRecord('8/8/8/8/8/8/8/8 w - e4 0 1'), FENParseError);
});

test('parseFENRecord: rejects fullmove zero', () => {
  assert.throws(() => parseFENRecord('8/8/8/8/8/8/8/8 w - - 0 0'), FENParseError);
});

test('buildFENRecord: round-trips a parsed record', () => {
  const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 5 12';
  assert.equal(buildFENRecord(parseFENRecord(fen)), fen);
});

test('buildFENRecord: applies defaults for partial input', () => {
  const board = parseFEN(START_POS);
  assert.equal(buildFENRecord({ board }), `${START_POS} w - - 0 1`);
});

test('toggleActiveColor: flips side to move without mutation', () => {
  const r = parseFENRecord(START_FEN);
  const flipped = toggleActiveColor(r);
  assert.equal(flipped.activeColor, 'b');
  assert.equal(r.activeColor, 'w');
});

test('fenPlacementField: extracts board field', () => {
  assert.equal(fenPlacementField(START_FEN), START_POS);
  assert.equal(fenPlacementField(START_POS), START_POS);
});

test('normalizeFEN: completes a placement-only string', () => {
  assert.equal(normalizeFEN(START_POS), `${START_POS} w - - 0 1`);
  assert.equal(normalizeFEN(START_FEN), START_FEN);
});


test('cloneBoard: independent copy', () => {
  const b = parseFEN(START_POS);
  const copy = cloneBoard(b);
  copy[0]![0] = '';
  assert.equal(b[0]?.[0], 'r');
});

test('getPieceAt: algebraic and indices', () => {
  const b = parseFEN(START_POS);
  assert.equal(getPieceAt(b, 'a8'), 'r');
  assert.equal(getPieceAt(b, [0, 0]), 'r');
  assert.equal(getPieceAt(b, 'e4'), '');
  assert.equal(getPieceAt(b, 'z9'), null);
});

test('setPieceAt: places piece without mutation', () => {
  const b = createEmptyBoard();
  const next = setPieceAt(b, 'e4', 'Q');
  assert.equal(getPieceAt(next, 'e4'), 'Q');
  assert.equal(getPieceAt(b, 'e4'), '');
});

test('removePieceAt: clears a square', () => {
  const b = parseFEN(START_POS);
  const next = removePieceAt(b, 'a8');
  assert.equal(getPieceAt(next, 'a8'), '');
});

test('movePiece: relocates a piece', () => {
  const b = parseFEN(START_POS);
  const next = movePiece(b, 'b1', 'c3');
  assert.equal(getPieceAt(next, 'b1'), '');
  assert.equal(getPieceAt(next, 'c3'), 'N');
});

test('movePiece: no-op from empty square', () => {
  const b = parseFEN(START_POS);
  const next = movePiece(b, 'e4', 'e5');
  assert.deepEqual(next, b);
});

test('flipBoard: rotates 180 degrees', () => {
  const b = parseFEN(START_POS);
  const f = flipBoard(b);
  assert.equal(getPieceAt(f, 'h1'), 'r');
  assert.equal(getPieceAt(f, 'a8'), 'R');
});

test('listPieces: counts and order', () => {
  const list = listPieces(parseFEN(START_POS));
  assert.equal(list.length, 32);
  assert.deepEqual(list[0], { square: 'a8', piece: 'r' });
});

test('countPieces: starting material', () => {
  const counts = countPieces(parseFEN(START_POS));
  assert.equal(counts['P'], 8);
  assert.equal(counts['k'], 1);
});

test('materialBalance: balanced start, then White up a queen', () => {
  assert.equal(materialBalance(parseFEN(START_POS)), 0);
  const noBlackQueen = removePieceAt(parseFEN(START_POS), 'd8');
  assert.equal(materialBalance(noBlackQueen), 9);
});

test('findKing: locates kings', () => {
  const b = parseFEN(START_POS);
  assert.equal(findKing(b, 'w'), 'e1');
  assert.equal(findKing(b, 'b'), 'e8');
  assert.equal(findKing(createEmptyBoard(), 'w'), null);
});

test('hasBothKings: start vs empty', () => {
  assert.equal(hasBothKings(parseFEN(START_POS)), true);
  assert.equal(hasBothKings(createEmptyBoard()), false);
});


test('getBoardTheme: known and unknown', () => {
  assert.equal(getBoardTheme('classic')?.name, 'Classic');
  assert.equal(getBoardTheme('nope'), null);
});

test('listThemeIds: includes classic', () => {
  assert.ok(listThemeIds().includes('classic'));
});

test('getPieceSet: lookup by id', () => {
  assert.equal(getPieceSet('cburnett')?.name, 'Classic (CBurnett)');
  assert.equal(getPieceSet('missing'), null);
});

test('pieceSetsByPopularity: cburnett ranks first', () => {
  const sorted = pieceSetsByPopularity();
  assert.equal(sorted[0]?.id, 'cburnett');
  assert.equal(sorted.length, PIECE_SETS.length);
});

test('getQualityPreset: by multiplier value', () => {
  assert.equal(getQualityPreset(1)?.mode, 'print');
  assert.equal(getQualityPreset(99), null);
});

test('themeContrast: positive ratio', () => {
  const theme = getBoardTheme('classic')!;
  assert.ok(themeContrast(theme) > 1);
});

test('themeCoordinateColor: returns black or white', () => {
  const theme = getBoardTheme('classic')!;
  assert.ok(['black', 'white'].includes(themeCoordinateColor(theme)));
});


test('readImageDimensions: reads a PNG IHDR', () => {
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const dv = new DataView(png.buffer);
  dv.setUint32(16, 640);
  dv.setUint32(20, 480);
  assert.deepEqual(readImageDimensions(png), { width: 640, height: 480 });
});

test('readImageDimensions: reads a JPEG SOF0', () => {
  const jpeg = new Uint8Array([
    0xff, 0xd8,             // SOI
    0xff, 0xc0, 0x00, 0x11, // SOF0, length 17
    0x08,                   // precision
    0x01, 0x2c,             // height = 300
    0x02, 0x58,             // width = 600
    0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xff, 0xd9,             // EOI
  ]);
  assert.deepEqual(readImageDimensions(jpeg), { width: 600, height: 300 });
});

test('readImageDimensions: null for unknown format', () => {
  assert.equal(readImageDimensions(new Uint8Array([0, 1, 2, 3])), null);
});

test('physicalSize: pixels to inches and mm', () => {
  const { inches, mm } = physicalSize(600, 300);
  assert.equal(inches, 2);
  assert.equal(Math.round(mm), 51);
  assert.deepEqual(physicalSize(600, 0), { inches: 0, mm: 0 });
});


test('isValidHighlight: accepts valid, rejects bad square/color/style', () => {
  assert.equal(isValidHighlight({ square: 'e4' }), true);
  assert.equal(isValidHighlight({ square: 'e4', color: '#ff0000', style: 'ring' }), true);
  assert.equal(isValidHighlight({ square: 'z9' }), false);
  assert.equal(isValidHighlight({ square: 'e4', color: 'red' }), false);
  assert.equal(isValidHighlight({ square: 'e4', style: 'glow' as never }), false);
});

test('isValidArrow: accepts valid, rejects bad squares/degenerate/color', () => {
  assert.equal(isValidArrow({ from: 'e2', to: 'e4' }), true);
  assert.equal(isValidArrow({ from: 'e2', to: 'e2' }), false);
  assert.equal(isValidArrow({ from: 'e2', to: 'z9' }), false);
  assert.equal(isValidArrow({ from: 'e2', to: 'e4', color: 'not-a-color' }), false);
});

test('sanitizeAnnotations: drops invalid entries, keeps valid ones', () => {
  const result = sanitizeAnnotations({
    highlights: [{ square: 'e4' }, { square: 'bad' }],
    arrows: [{ from: 'e2', to: 'e4' }, { from: 'a1', to: 'a1' }],
    check: { square: 'e1' },
  });
  assert.equal(result.highlights?.length, 1);
  assert.equal(result.arrows?.length, 1);
  assert.equal(result.check?.square, 'e1');
});

test('sanitizeAnnotations: omits empty keys entirely', () => {
  const result = sanitizeAnnotations({ highlights: [{ square: 'bad' }] });
  assert.equal(result.highlights, undefined);
  assert.deepEqual(result, {});
});

test('renderHighlightsSVG: fill and ring styles produce markup', () => {
  const toPixel = () => ({ x: 0, y: 0 });
  const fillSvg = renderHighlightsSVG([{ square: 'e4', style: 'fill' }], toPixel, 50);
  assert.match(fillSvg, /<rect/);
  assert.match(fillSvg, /fill-opacity="0.55"/);
  const ringSvg = renderHighlightsSVG([{ square: 'e4', style: 'ring' }], toPixel, 50);
  assert.match(ringSvg, /stroke=/);
  assert.equal(renderHighlightsSVG([{ square: 'bad' }], toPixel, 50), '');
});

test('renderArrowsSVG: produces a line and marker per valid arrow', () => {
  const toPixel = (sq: string) => (sq === 'e2' ? { x: 0, y: 50 } : { x: 0, y: 0 });
  const svg = renderArrowsSVG([{ from: 'e2', to: 'e4' }], toPixel, 50);
  assert.match(svg, /<line/);
  assert.match(svg, /<marker/);
  assert.equal(renderArrowsSVG([{ from: 'e2', to: 'e2' }], toPixel, 50), '');
});

test('renderCheckIndicatorSVG: produces a radial gradient and circle', () => {
  const toPixel = () => ({ x: 0, y: 0 });
  const svg = renderCheckIndicatorSVG({ square: 'e1', type: 'check' }, toPixel, 50);
  assert.match(svg, /radialGradient/);
  assert.match(svg, /<circle/);
  assert.equal(renderCheckIndicatorSVG({ square: 'bad' }, toPixel, 50), '');
});

test('generateDiagram: renders with annotations without throwing', () => {
  const svg = generateDiagram({
    fen: START_FEN,
    annotations: {
      highlights: [{ square: 'e2', style: 'fill' }, { square: 'e4', style: 'ring' }],
      arrows: [{ from: 'e2', to: 'e4' }],
      check: { square: 'e8', type: 'check' },
    },
  });
  assert.match(svg, /<svg/);
  assert.match(svg, /<marker/);
  assert.match(svg, /radialGradient/);
});


test('pointToSquare: maps pixel to algebraic square', () => {
  assert.equal(pointToSquare({ x: 10, y: 10 }, { size: 400 }), 'a8');
  assert.equal(pointToSquare({ x: 390, y: 390 }, { size: 400 }), 'h1');
  assert.equal(pointToSquare({ x: 210, y: 260 }, { size: 400 }), 'e3');
});

test('pointToSquare: respects flipped board', () => {
  assert.equal(pointToSquare({ x: 10, y: 10 }, { size: 400, flipped: true }), 'h1');
});

test('pointToSquare: respects offset and returns null outside bounds', () => {
  assert.equal(pointToSquare({ x: 110, y: 110 }, { size: 400, offsetX: 100, offsetY: 100 }), 'a8');
  assert.equal(pointToSquare({ x: -5, y: 10 }, { size: 400 }), null);
  assert.equal(pointToSquare({ x: 401, y: 10 }, { size: 400 }), null);
});

test('squareToPoint: inverse of pointToSquare', () => {
  const bounds = squareToPoint('d4', { size: 400 });
  assert.deepEqual(bounds, { x: 150, y: 200, size: 50 });
  assert.equal(squareToPoint('z9', { size: 400 }), null);
});

test('squareToPoint <-> pointToSquare round-trip for every square', () => {
  const files = 'abcdefgh';
  for (const file of files) {
    for (let rank = 1; rank <= 8; rank++) {
      const square = `${file}${rank}`;
      const bounds = squareToPoint(square, { size: 400 });
      assert.ok(bounds);
      const center = { x: bounds.x + bounds.size / 2, y: bounds.y + bounds.size / 2 };
      assert.equal(pointToSquare(center, { size: 400 }), square);
    }
  }
});

test('applyDragMove: moves a piece and reports capture', () => {
  const board = parseFEN(START_FEN);
  const result = applyDragMove(board, 'e2', 'e4');
  assert.equal(result.moved, true);
  assert.equal(result.captured, null);
  assert.equal(result.board[4]?.[4], 'P');
  assert.equal(result.board[6]?.[4], '');
});

test('applyDragMove: reports the captured piece', () => {
  let board = setPieceAt(parseFEN(START_FEN), 'e4', 'P');
  board = setPieceAt(board, 'd5', 'p');
  const result = applyDragMove(board, 'e4', 'd5');
  assert.equal(result.moved, true);
  assert.equal(result.captured, 'p');
});

test('applyDragMove: no-op when source is empty or from === to', () => {
  const board = parseFEN(START_FEN);
  const result1 = applyDragMove(board, 'e4', 'e5');
  assert.equal(result1.moved, false);
  assert.equal(result1.board, board);
  const result2 = applyDragMove(board, 'e2', 'e2');
  assert.equal(result2.moved, false);
});

test('applyDragRemove: clears the source square', () => {
  const board = parseFEN(START_FEN);
  const result = applyDragRemove(board, 'e2');
  assert.equal(result[6]?.[4], '');
});

test('applyPaletteDrop: places a piece from an external source', () => {
  const board = createEmptyBoard();
  const result = applyPaletteDrop(board, 'e4', 'Q');
  assert.equal(result[4]?.[4], 'Q');
});

test('resolveClick: selects an occupied square when nothing is selected', () => {
  const board = parseFEN(START_FEN);
  assert.deepEqual(resolveClick('e2', null, board), { kind: 'select', square: 'e2' });
});

test('resolveClick: clicking empty square with nothing selected deselects', () => {
  const board = parseFEN(START_FEN);
  assert.deepEqual(resolveClick('e4', null, board), { kind: 'deselect' });
});

test('resolveClick: clicking the selected square again deselects', () => {
  const board = parseFEN(START_FEN);
  assert.deepEqual(resolveClick('e2', 'e2', board), { kind: 'deselect' });
});

test('resolveClick: clicking another occupied square retargets selection', () => {
  const board = parseFEN(START_FEN);
  assert.deepEqual(resolveClick('d2', 'e2', board), { kind: 'select', square: 'd2' });
});

test('resolveClick: clicking an empty square completes a move', () => {
  const board = parseFEN(START_FEN);
  assert.deepEqual(resolveClick('e4', 'e2', board), { kind: 'move', from: 'e2', to: 'e4' });
});
