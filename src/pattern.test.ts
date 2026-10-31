import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BOARD_THEMES, STARTING_FEN } from './constants.ts';
import {
  HATCH_DIVISIONS,
  boardOutlineWidth,
  hatchBoardPath,
  hatchLineWidth,
  pieceHaloRadius,
  hatchPatternSVG,
  hatchSegments,
  isSquarePattern,
} from './pattern.ts';
import { generateDiagram } from './svg.ts';

test('isSquarePattern accepts only solid and hatched', () => {
  assert.ok(isSquarePattern('solid'));
  assert.ok(isSquarePattern('hatched'));
  assert.ok(!isSquarePattern('dotted'));
  assert.ok(!isSquarePattern(undefined));
});

test('hatchSegments lie on u + v = k·step and cover all four corners', () => {
  const size = 80;
  const step = size / HATCH_DIVISIONS;
  const segments = hatchSegments(size);
  assert.equal(segments.length, HATCH_DIVISIONS * 2 + 1);
  segments.forEach(([x1, y1, x2, y2], i) => {
    assert.equal(x1 + y1, i * step);
    assert.equal(x2 + y2, i * step);
    assert.ok(x1 > size || y1 < 0);
    assert.ok(x2 < 0 || y2 > size);
  });
  const sums = segments.map(([x, y]) => x + y);
  assert.equal(sums[0], 0);
  assert.equal(sums.at(-1), 2 * size);
});

test('hatchLineWidth scales with the square size', () => {
  assert.equal(hatchLineWidth(160), hatchLineWidth(80) * 2);
  assert.ok(hatchLineWidth(80) > 0);
});

test('hatchPatternSVG anchors a square-aligned tile at the board origin', () => {
  const svg = hatchPatternSVG('p', 80, 12, 4, '#000000');
  assert.match(svg, /<pattern id="p" patternUnits="userSpaceOnUse" x="12" y="4" width="8" height="8">/);
  assert.match(svg, /stroke="#000000"/);
});

test('generateDiagram draws hatched dark squares on the light colour', () => {
  const svg = generateDiagram({
    fen: STARTING_FEN,
    size: 400,
    lightSquare: '#ffffff',
    darkSquare: '#000000',
    squarePattern: 'hatched',
  });
  const clip = /<clipPath id="cv-hatch">(.*?)<\/clipPath>/.exec(svg)?.[1] ?? '';
  assert.equal((clip.match(/<rect /g) ?? []).length, 32);
  assert.equal((svg.match(/clip-path="url\(#cv-hatch\)"/g) ?? []).length, 1);
  assert.equal((svg.match(/width="50" height="50" fill=/g) ?? []).length, 0);
  assert.ok(!svg.includes('<pattern'));
});

test('generateDiagram lays every square on one continuous base', () => {
  const svg = generateDiagram({ fen: STARTING_FEN, size: 400, lightSquare: '#eeeeee', darkSquare: '#333333' });
  const o = boardOutlineWidth(400);
  assert.ok(svg.includes(`<rect x="${o}" y="${o}" width="400" height="400" fill="#eeeeee"/>`));
  assert.equal((svg.match(/width="50" height="50" fill="#eeeeee"/g) ?? []).length, 0);
  assert.equal((svg.match(/width="50" height="50" fill="#333333"/g) ?? []).length, 32);
});

test('hatchBoardPath continues the square hatching across the whole board', () => {
  const d = hatchBoardPath(10, 20, 80);
  const segments = d.split('M').filter(Boolean);
  assert.equal(segments.length, HATCH_DIVISIONS * 16 + 1);
  assert.equal(segments[0], '18,12L2,28');
  for (const segment of segments) {
    const [x1, y1, x2, y2] = segment.split(/[,L]/).map(Number);
    assert.ok(Math.abs(x1! - 10 + (y1! - 20) - (x2! - 10 + (y2! - 20))) < 1e-9);
  }
});

test('generateDiagram haloes only the pieces standing on hatched squares', () => {
  const svg = generateDiagram({ fen: STARTING_FEN, squarePattern: 'hatched' });
  assert.match(svg, /<filter id="cv-halo"/);
  assert.equal((svg.match(/filter="url\(#cv-halo\)"/g) ?? []).length, 16);
  assert.ok(!generateDiagram({ fen: STARTING_FEN }).includes('cv-halo'));
});

test('generateDiagram frames the board on all four sides inside the canvas', () => {
  const size = 480;
  const o = boardOutlineWidth(size);
  const svg = generateDiagram({ fen: STARTING_FEN, size });
  assert.ok(svg.includes(`viewBox="0 0 ${size + o * 2} ${size + o * 2}"`));
  assert.ok(svg.includes(`<rect x="0" y="0" width="${size + o * 2}" height="${size + o * 2}" fill="#000000"/>`));
  assert.ok(svg.includes(`<rect x="${o}" y="${o}" width="${size}" height="${size}"`));
});

test('outline and halo follow the measured book proportions', () => {
  assert.equal(boardOutlineWidth(576), 3);
  assert.equal(boardOutlineWidth(100), 1);
  assert.ok(Math.abs(pieceHaloRadius(72) - 2.52) < 1e-9);
});

test('generateDiagram stays solid by default', () => {
  const svg = generateDiagram({ fen: STARTING_FEN });
  assert.ok(!svg.includes('cv-hatch'));
});

test('BOARD_THEMES keeps 20 themes with print right after the wood tones', () => {
  const ids = Object.keys(BOARD_THEMES);
  assert.equal(ids.length, 20);
  assert.deepEqual(ids.slice(0, 6), ['classic', 'brown', 'wood', 'sand', 'print', 'slate']);
  assert.deepEqual(BOARD_THEMES['print'], { name: 'Print', light: '#ffffff', dark: '#000000' });
});
