# Editing positions

The board helpers in `board.ts` are pure: every function returns a new board and
never mutates its input. Combine them with the FEN record helpers to read, edit,
and re-serialize positions.

## Squares

Every helper accepts a square as either:

- an algebraic string: `'e4'`
- matrix indices: `[row, col]`, where `row 0` is rank 8 and `col 0` is file a.

Use `squareToIndices` / `indicesToSquare` to convert explicitly.

## Read a full position

```ts
import { parseFENRecord, findKing } from '@chessviewer-org/chess-viewer';

const record = parseFENRecord('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 5 12');
record.activeColor;          // 'b'
record.enPassant;            // 'e3'
findKing(record.board, 'w'); // 'e1'
```

## Edit immutably

```ts
import { parseFEN, movePiece, removePieceAt, materialBalance } from '@chessviewer-org/chess-viewer';

const start = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

const developed = movePiece(start, 'g1', 'f3'); // new board; `start` is unchanged
const oddsGame = removePieceAt(start, 'a1');     // remove a rook
materialBalance(oddsGame);                       // -5 (Black is up a rook of material)
```

## Re-serialize

```ts
import { parseFENRecord, buildFENRecord, toggleActiveColor, movePiece } from '@chessviewer-org/chess-viewer';

const record = parseFENRecord('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
const next = toggleActiveColor({ ...record, board: movePiece(record.board, 'e2', 'e4') });

buildFENRecord(next);
// 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
```

> Note: these helpers manipulate piece placement only. They do not enforce chess
> legality (no move generation, check detection, or en passant bookkeeping) —
> see the [roadmap](../../ROADMAP.md#out-of-scope).
