# FEN handling reference

[Forsyth–Edwards Notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
(FEN) describes a chess position as up to six space-separated fields.

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
└────────── placement ─────────────┘ │  │   │  │ └ fullmove
                                     │  │   │  └── halfmove clock
                                     │  │   └───── en passant target
                                     │  └───────── castling rights
                                     └──────────── active color
```

## What the parsers accept

| Function | Input | Output |
| -------- | ----- | ------ |
| `parseFEN` | full FEN **or** placement-only | `BoardMatrix` (8×8) |
| `parseFENRecord` | full FEN **or** placement-only | `FENRecord` (all six fields) |

`parseFEN` reads only the placement field, so both of these are valid:

```ts
parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');               // ok
parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');  // ok
```

`parseFENRecord` fills standard defaults (`w`, `-`, `-`, `0`, `1`) for any
trailing fields you omit.

## Validation

| Function | Use |
| -------- | --- |
| `validateFEN(fen)` | Boolean — is the placement field valid? |
| `getFENValidationError(fen)` | Short error string for the placement field, `''` if valid. |
| `validateFENDetailed(fen)` | Validates **all six** fields with user-facing messages. |

`validateFENDetailed` is stricter: it requires exactly six fields and checks the
active color, castling rights, en passant square, and clocks — useful for form
validation in a UI.

## Normalization

```ts
import { normalizeFEN } from '@chessviewer-org/chess-viewer';

normalizeFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
// 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1'
```

`normalizeFEN` parses and re-serializes, producing a canonical six-field string.
It throws `FENParseError` if the placement field is invalid.

## Limits

`MAX_FEN_LENGTH` (93) bounds accepted input length to guard against pathological
strings. Errors are thrown as `FENParseError`.
