# Examples

Runnable examples for [`@chessviewer-org/chess-viewer`](https://www.npmjs.com/package/@chessviewer-org/chess-viewer).

Each file is self-contained. Run them with [`tsx`](https://github.com/privatenumber/tsx) (no build step needed):

```bash
npm install
npx tsx examples/generate-diagram.ts
npx tsx examples/edit-position.ts
npx tsx examples/themes.ts
```

| File | What it shows |
|------|---------------|
| [`generate-diagram.ts`](./generate-diagram.ts) | Render a FEN to a self-contained SVG and write it to disk. |
| [`edit-position.ts`](./edit-position.ts) | Parse a full FEN record, edit the board with the pure board helpers, and serialize it back. |
| [`themes.ts`](./themes.ts) | List board themes and piece sets, and pick a contrast-safe coordinate color. |

> The examples import from `../src` so they always track the latest source.
> When consuming the published package, import from `@chessviewer-org/chess-viewer` instead.
