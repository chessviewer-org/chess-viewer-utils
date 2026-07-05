# Export pipeline

`generateDiagram` produces SVG. To deliver a print-ready raster (PNG/JPEG) you
rasterize the SVG with a tool of your choice, then stamp the correct DPI so the
physical size is right. This library provides the DPI and dimension helpers; it
does not rasterize (that keeps it dependency-free).

## 1. Render SVG

```ts
import { generateDiagram } from '@chessviewer-org/chess-viewer';

const svg = generateDiagram({ fen, size: 1200 }); // render large, then scale down
```

## 2. Rasterize (your choice of tool)

- **Browser:** draw the SVG to a `<canvas>` and call `canvas.toBlob()`.
- **Node.js:** use a renderer such as `sharp`, `@resvg/resvg-js`, or `sharp`'s
  SVG input. These are *your* dependencies, not the library's.

## 3. Stamp DPI

```ts
import { changeDPI } from '@chessviewer-org/chess-viewer';

// `blob` is the PNG/JPEG from step 2
const print = await changeDPI(blob, 300, 'png'); // 300 DPI for print
```

`changeDPI` rewrites the PNG `pHYs` chunk or the JPEG JFIF density fields in
place. It works in both Node.js and the browser because it operates on `Blob` /
`Uint8Array`.

## 4. Verify dimensions and physical size

```ts
import { readImageDimensions, physicalSize } from '@chessviewer-org/chess-viewer';

const bytes = new Uint8Array(await print.arrayBuffer());
const dims = readImageDimensions(bytes);     // { width: 1200, height: 1200 }
physicalSize(dims!.width, 300);              // { inches: 4, mm: 101.6 }
```

## Quality presets

`QUALITY_PRESETS` maps export multipliers to print/social DPI targets and
estimated file sizes. Look one up with `getQualityPreset(value)`.
