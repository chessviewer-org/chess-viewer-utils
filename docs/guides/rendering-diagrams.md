# Rendering diagrams

`generateDiagram` turns a FEN string into a self-contained SVG. No DOM, no
canvas, no network — the output is a string you can write to a file, inline in
HTML, or rasterize downstream.

## Basic render

```ts
import { generateDiagram } from '@chessviewer-org/chess-viewer';

const svg = generateDiagram({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  size: 400,
});
```

## Theming

Use a built-in theme instead of hand-picking colors:

```ts
import { generateDiagram, getBoardTheme, themeCoordinateColor } from '@chessviewer-org/chess-viewer';

const theme = getBoardTheme('wood')!;

const svg = generateDiagram({
  fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
  showCoords: true,
  showFrame: true,
  lightSquare: theme.light,
  darkSquare: theme.dark,
  coordColor: themeCoordinateColor(theme), // 'white' on dark themes, 'black' on light
});
```

### Keeping coordinates legible

Coordinate labels default to black. On dark themes they disappear, so pass
`coordColor`. The simplest source is `themeCoordinateColor(theme)`, which returns
`'white'` or `'black'` based on the theme's dark-square contrast. You can also
pass any hex string.

## Orientation and framing

| Option | Effect |
| ------ | ------ |
| `flipped: true` | Render from Black's perspective. |
| `showCoords: true` | Draw file (a–h) and rank (1–8) labels in a border. |
| `showFrame: true` | Add a thin outer frame around the board. |
| `label` | Sets the SVG `aria-label` / `<title>` for accessibility. |

## Tips

- `size` is the board edge in pixels; coordinates and frame add to the total
  SVG dimensions.
- The output is deterministic — the same options always produce the same SVG,
  which makes it safe for snapshot tests and caching.
