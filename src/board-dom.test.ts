import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createBoard } from './board-dom.ts';
import { STARTING_FEN } from './constants.ts';

/* ------------------------------------------------------------------ */
/* Minimal DOM stub (the module only touches a small surface)         */
/* ------------------------------------------------------------------ */

class FakeClassList {
  private names = new Set<string>();
  toggle(name: string, force?: boolean): boolean {
    if (force === undefined) force = !this.names.has(name);
    if (force) this.names.add(name);
    else this.names.delete(name);
    return force;
  }
  contains(name: string): boolean {
    return this.names.has(name);
  }
}

class FakeElement {
  tagName: string;
  className = '';
  type = '';
  tabIndex = -1;
  hidden = false;
  draggable = false;
  textContent = '';
  children: FakeElement[] = [];
  firstElementChild: FakeElement | null = null;
  style: { backgroundColor: string } = { backgroundColor: '' };
  classList = new FakeClassList();
  private attrs = new Map<string, string>();
  private parent: FakeElement | null = null;

  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }

  appendChild(child: FakeElement): void {
    this.children.push(child);
    child.parent = this;
    this.firstElementChild ??= child;
  }

  removeChild(child: FakeElement): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      if (this.firstElementChild === child) this.firstElementChild = this.children[0] ?? null;
    }
  }

  remove(): void {
    this.parent?.removeChild(this);
  }
}

class FakeImageElement extends FakeElement {
  constructor() {
    super('img');
  }
}

globalThis.HTMLImageElement = FakeImageElement as unknown as typeof HTMLImageElement;
globalThis.document = {
  createElement: (tag: string) =>
    tag.toLowerCase() === 'img' ? new FakeImageElement() : new FakeElement(tag),
} as unknown as Document;

function makeContainer(): FakeElement {
  return new FakeElement('div');
}

function squaresOf(board: BoardApi): FakeElement[] {
  return board.getGrid().children as unknown as FakeElement[];
}

function pieceImg(square: FakeElement): FakeImageElement | null {
  return square.firstElementChild as FakeImageElement | null;
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

test('createBoard builds 64 squares with 32 pieces for the starting position', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN });
  const grid = board.getGrid();
  assert.equal(grid.getAttribute('role'), 'grid');
  const squares = squaresOf(board);
  assert.equal(squares.length, 64);
  assert.equal(squares.filter((s) => pieceImg(s) !== null).length, 32);
  assert.equal(squares[0]?.getAttribute('data-r'), '0');
  assert.equal(squares[0]?.getAttribute('data-c'), '0');
  assert.equal(squares[0]?.getAttribute('aria-label'), 'a8');
  assert.equal(squares[63]?.getAttribute('aria-label'), 'h1');
  board.destroy();
});

test('default piece theme points at /piece/{style}/{piece}.svg', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN });
  const img = pieceImg(squaresOf(board)[0] as FakeElement);
  assert.equal(img?.getAttribute('src'), '/piece/cburnett/bR.svg');
  assert.equal(img?.getAttribute('alt'), 'Black Rook');
  board.destroy();
});

test('set(fen) updates pieces in place', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN });
  board.set({ fen: 'q7/8/8/8/8/8/8/8 w - - 0 1' });
  const img = pieceImg(squaresOf(board)[0] as FakeElement);
  assert.equal(img?.getAttribute('src'), '/piece/cburnett/bQ.svg');
  assert.equal(img?.getAttribute('alt'), 'Black Queen');
  assert.equal(squaresOf(board).filter((s) => pieceImg(s) !== null).length, 1);
  board.destroy();
});

test('invalid FEN falls back gracefully without throwing', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: 'not a fen' });
  assert.equal(board.getFen(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  board.destroy();
});

test('orientation black mirrors data-r/data-c mapping', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN, orientation: 'black' });
  const squares = squaresOf(board);
  assert.equal(squares[0]?.getAttribute('data-r'), '0');
  assert.equal(squares[0]?.getAttribute('data-c'), '0');
  assert.equal(squares[0]?.getAttribute('aria-label'), 'h1');
  assert.equal(squares[63]?.getAttribute('aria-label'), 'a8');
  board.toggleOrientation();
  assert.equal(squares[0]?.getAttribute('data-r'), '0');
  assert.equal(squares[0]?.getAttribute('data-c'), '0');
  assert.equal(squares[0]?.getAttribute('aria-label'), 'a8');
  assert.equal(squares[63]?.getAttribute('aria-label'), 'h1');
  board.destroy();
});

test('coordinates are siblings of the grid and can be hidden', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN, coordinates: true });
  const coords = container.children.slice(1) as unknown as FakeElement[];
  assert.equal(coords.length, 2);
  assert.equal(coords[0]?.hidden, false);
  assert.equal(coords[0]?.children.length, 8);
  board.set({ coordinates: false });
  assert.equal(coords[0]?.hidden, true);
  board.destroy();
});

test('selectSquare highlights and clears the square', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN });
  const target = squaresOf(board)[0] as FakeElement;
  board.selectSquare('a8');
  assert.equal(target.classList.contains('board-square-selected'), true);
  assert.equal(target.getAttribute('aria-selected'), 'true');
  board.selectSquare(null);
  assert.equal(target.classList.contains('board-square-selected'), false);
  assert.equal(target.getAttribute('aria-selected'), 'false');
  board.destroy();
});

test('getSquare resolves both notation and coordinates', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN });
  const byNotation = board.getSquare('e4');
  const byIndex = board.getSquare([4, 4]);
  assert.equal(byNotation, byIndex);
  assert.equal(byNotation?.getAttribute('data-r'), '4');
  board.destroy();
});

test('getFen returns the placement', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: '8/8/8/8/8/8/8/8 w - - 0 1' });
  assert.equal(board.getFen(), '8/8/8/8/8/8/8/8');
  board.destroy();
});

test('custom pieceTheme and pieceStyle are applied', () => {
  const container = makeContainer();
  const board = createBoard(container, {
    fen: 'K7/8/8/8/8/8/8/8 w - - 0 1',
    pieceStyle: 'merida',
    pieceTheme: 'img/pieces/{style}/{piece}.svg',
  });
  const img = pieceImg(squaresOf(board)[0] as FakeElement);
  assert.equal(img?.getAttribute('src'), 'img/pieces/merida/wK.svg');
  board.set({ pieceStyle: 'cburnett' });
  assert.equal(img?.getAttribute('src'), 'img/pieces/cburnett/wK.svg');
  board.destroy();
});

test('destroy removes the grid from the container', () => {
  const container = makeContainer();
  const board = createBoard(container, { fen: STARTING_FEN });
  board.destroy();
  assert.equal(container.children.length, 0);
});
