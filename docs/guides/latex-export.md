# LaTeX export

`generateBoardLatex` turns one position into LaTeX markup, and
`generateLatexDocument` typesets a whole collection. Both are pure functions:
they return a string and never touch the file system or run TeX.

## Packages

| `latexPackage` | CTAN package             | Best for                                                                |
| -------------- | ------------------------ | ----------------------------------------------------------------------- |
| `skak`         | `skak`                   | Plain diagrams inside running text                                      |
| `chessboard`   | `chessboard`             | Coordinates, side-to-move marker, highlighted squares and arrows        |
| `diagram`      | `chess-problem-diagrams` | Problem-book layout: author, source, award, stipulation and piece count |

`LATEX_PACKAGE_META` tells a UI what each package can do: `supportsFlip` and
`supportsMarks` are `false` for `diagram`, which always prints White at the
bottom and draws no coordinates, and for `skak`, which cannot draw marks.

## A single diagram

```ts
import { generateBoardLatex } from "@chessviewer-org/chess-viewer";

generateBoardLatex({
  fen: "r5k1/1b1p1ppp/p7/1p1Q4/2p1r3/PP4Pq/BBP2b1P/R4R1K w - - 0 20",
  latexPackage: "chessboard",
  flipped: true,
  showCoords: false,
  boardSize: "small",
  highlights: [{ square: "d5" }],
  arrows: [{ from: "d5", to: "a8", color: "#15781b" }],
});
```

The default `mode: 'snippet'` returns the `\usepackage` line followed by the
board. Paste the first line into your preamble and the rest where the diagram
belongs.

## A collection

```ts
import { generateLatexDocument } from "@chessviewer-org/chess-viewer";

const tex = generateLatexDocument({
  latexPackage: "diagram",
  mode: "document",
  documentClass: "book",
  paper: "a5",
  columns: 2,
  boardSize: "small",
  solutions: true,
  title: "Two-movers",
  documentAuthor: "A. Composer",
  positions: [
    {
      fen: "8/8/8/3k4/8/4K3/3Q4/8 w - - 0 1",
      author: "Loyd, Sam",
      source: "Chess Monthly, 1903",
      award: "1st Prize",
      stipulation: "#2",
      solution: "1.Qd2-c3!",
    },
  ],
});
```

### Output modes

| `mode`       | Result                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| `snippet`    | Package line and boards, for an existing document                         |
| `document`   | A complete `\documentclass` … `\end{document}` file                       |
| `standalone` | `standalone` class with `varwidth=170mm`: a cropped figure PDF for papers |

### Layout options

| Option                    | Values                                 | Default   |
| ------------------------- | -------------------------------------- | --------- |
| `columns`                 | 1–4 (`LATEX_COLUMN_RANGE`)             | 1         |
| `boardSize`               | `tiny`, `small`, `normal`, `large`     | `normal`  |
| `documentClass`           | `article`, `report`, `book`            | `article` |
| `paper`                   | `a4`, `a5`, `letter`                   | `a4`      |
| `fontSize`                | 10, 11, 12                             | 11        |
| `marginMm`                | 5–50 (`LATEX_MARGIN_RANGE_MM`)         | 20        |
| `title`, `documentAuthor` | text, adds `\maketitle`                | —         |
| `numbering`               | `No. n` labels                         | on for 2+ |
| `pieceCount`              | `(white+black)` beside the stipulation | off       |
| `solutions`               | Solutions section at the end           | off       |
| `showCoords`, `showMover` | boolean                                | `true`    |
| `captionStyle`            | see [Caption styles](#caption-styles)  | `classic` |

A document holds at most `LATEX_MAX_POSITIONS` (100) positions. Invalid
options throw instead of being silently replaced.

### Position fields

`fen` is required. `flipped`, `caption`, `author`, `source`, `award`,
`stipulation`, `remark`, `solution`, `white`, `black`, `event`, `date` and
`captionStyle` are optional; empty fields are left out
of the markup. `highlights` and `arrows` use the same shapes as the SVG
renderer and are emitted only for `chessboard`, grouped by style and colour
with one `\definecolor` per colour.

With `diagram`, authors are written `Surname, First name` and separated by
`;`. A plain `First Last` is rewritten for you. Only the FEN placement field
is passed to `\fen`, because the package would read castling letters as
pieces, and the piece count it checks is computed from the same field.

### Caption styles

`captionStyle` sets how the text around each board is arranged. Set it on the
document and override it per position, so a book can mix games and problems.

| Style     | Above the board                          | Below the board                              |
| --------- | ---------------------------------------- | -------------------------------------------- |
| `classic` | —                                        | number, caption, credits, remark, stipulation |
| `problem` | number, caption, author, source, award   | stipulation left, `(white+black)` right      |
| `study`   | number, caption, author, source, award   | stipulation and `(white+black)` centred      |
| `game`    | number, `White -- Black`, event and date | caption left, side to move right             |
| `plain`   | number                                   | stipulation                                  |

Game positions take `white`, `black`, `event` and `date`. Every style except
`classic` sets each row of boards as one `tabular*` row, so the boards line up
even when their headings have different lengths, and the footer spans the
board width. This needs the `array` package, which every TeX installation has.

The `diagram` package keeps its own layout: `game` writes the players, event
and date into `\source` and the caption into `\remark`; `plain` keeps only the
stipulation.

## Safety

The FEN is normalized, fully validated and matched against
`/^[A-Za-z0-9/ -]+$/` before it reaches the markup. Every free-text field goes
through `escapeLatex`, which rewrites `\ & % $ # _ { } ~ ^`, drops control
characters and caps the length at 2000 characters, so `#2`, `50%` or `R&D` can
be typed as-is and nothing can inject `\input` or `\write18`.

## Compiling

The output targets pdfLaTeX. Document mode loads `T1` fonts with UTF-8 input
and, when the text contains `ə` or `Ə`, declares those characters through
`graphicx`. Install the package you use plus `geometry` (document mode) or
`standalone` (figure mode):

```bash
tlmgr install chess-problem-diagrams geometry
pdflatex collection.tex
```

On a minimal TeX Live (TinyTeX, BasicTeX) these are the full lists:

| Package      | `tlmgr install`                                          |
| ------------ | -------------------------------------------------------- |
| `skak`       | `skak chessfss lambda-lists skaknew`                     |
| `chessboard` | `chessboard chessfss pgf skaknew xifthen`                |
| `diagram`    | `chess-problem-diagrams bartel-chess-fonts pgf xstring`  |

Add `geometry` for document mode and `standalone varwidth` for figure mode.

With `diagram`, the package's not-computer-tested marker (`C-`) is switched off
with `\nocomputer`.
