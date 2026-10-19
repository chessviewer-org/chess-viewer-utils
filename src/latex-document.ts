import {
  type BoardLineOptions,
  LATEX_DIAGRAM_SIZE_PT,
  LATEX_PACKAGE_META,
  type LatexBoardSize,
  type LatexOutputMode,
  type LatexPackage,
  type LatexPosition,
  chessboardLines,
  cleanText,
  colorDefinition,
  diagramLines,
  fail,
  pieceCounts,
  positionColors,
  resolveBoardSize,
  resolveFen,
  resolvePackage,
  skakLines,
} from './latex-core.js';

export const LATEX_DOCUMENT_CLASSES = ['article', 'report', 'book'] as const;
export const LATEX_PAPER_SIZES = ['a4', 'a5', 'letter'] as const;
export const LATEX_FONT_SIZES = [10, 11, 12] as const;
export const LATEX_COLUMN_RANGE = { min: 1, max: 4 } as const;
export const LATEX_MARGIN_RANGE_MM = { min: 5, max: 50 } as const;
export const LATEX_MAX_POSITIONS = 100;

export type LatexDocumentClass = (typeof LATEX_DOCUMENT_CLASSES)[number];
export type LatexPaperSize = (typeof LATEX_PAPER_SIZES)[number];
export type LatexFontSize = (typeof LATEX_FONT_SIZES)[number];

export interface LatexLayoutOptions {
  latexPackage?: LatexPackage;
  mode?: LatexOutputMode;
  boardSize?: LatexBoardSize;
  flipped?: boolean;
  showCoords?: boolean;
  showMover?: boolean;
  columns?: number;
  documentClass?: LatexDocumentClass;
  paper?: LatexPaperSize;
  fontSize?: LatexFontSize;
  marginMm?: number;
  title?: string;
  documentAuthor?: string;
  numbering?: boolean;
  pieceCount?: boolean;
  solutions?: boolean;
}

export interface LatexDocumentConfig extends LatexLayoutOptions {
  positions: readonly LatexPosition[];
}

interface PreparedPosition {
  position: LatexPosition;
  fen: string;
  flipped: boolean;
  caption: string;
  author: string;
  source: string;
  award: string;
  stipulation: string;
  remark: string;
  solution: string;
}

const PAPER_OPTION: Record<LatexPaperSize, string> = {
  a4: 'a4paper',
  a5: 'a5paper',
  letter: 'letterpaper',
};

const STANDALONE_BORDER_PT = 6;
const STANDALONE_WIDTH_MM = 170;
const COLUMN_GAP_RATIO = 0.02;
const SCHWA_LOWER = 'ə';
const SCHWA_UPPER = 'Ə';

function pick<T extends readonly unknown[]>(
  list: T,
  value: unknown,
  fallback: T[number],
  name: string
): T[number] {
  if (value === undefined) return fallback;
  if (!(list as readonly unknown[]).includes(value)) {
    fail(`unsupported ${name} "${String(value)}"`);
  }
  return value as T[number];
}

function boundedInteger(
  value: unknown,
  range: { min: number; max: number },
  fallback: number,
  name: string
): number {
  if (value === undefined) return fallback;
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < range.min ||
    value > range.max
  ) {
    fail(`${name} must be a whole number from ${range.min} to ${range.max}`);
  }
  return value;
}

function preparePosition(
  position: LatexPosition,
  defaultFlipped: boolean
): PreparedPosition {
  if (!position || typeof position !== 'object') fail('position is missing');
  return {
    position,
    fen: resolveFen(position.fen),
    flipped: position.flipped ?? defaultFlipped,
    caption: cleanText(position.caption, 'caption'),
    author: cleanText(position.author, 'author'),
    source: cleanText(position.source, 'source'),
    award: cleanText(position.award, 'award'),
    stipulation: cleanText(position.stipulation, 'stipulation'),
    remark: cleanText(position.remark, 'remark'),
    solution: cleanText(position.solution, 'solution'),
  };
}

function numberLabel(index: number): string {
  return `\\textbf{No.~${index + 1}}`;
}

function captionLines(
  item: PreparedPosition,
  index: number,
  numbering: boolean,
  pieceCount: boolean
): string[] {
  const headline = [numbering ? numberLabel(index) : '', item.caption]
    .filter(Boolean)
    .join('\\quad ');
  const credits = [item.author, item.source, item.award]
    .filter(Boolean)
    .join(' --- ');
  const { white, black } = pieceCounts(item.fen);
  const footer = [
    item.stipulation ? `\\textbf{${item.stipulation}}` : '',
    pieceCount ? `(${white}+${black})` : '',
  ]
    .filter(Boolean)
    .join('\\quad ');

  const lines: string[] = [];
  if (headline) lines.push(`${headline}\\\\`);
  if (credits) lines.push(`{\\small ${credits}}\\\\`);
  if (item.remark) lines.push(`{\\small\\itshape ${item.remark}}\\\\`);
  if (footer) lines.push(`${footer}\\\\`);
  if (!lines.length) return lines;

  lines[lines.length - 1] = lines[lines.length - 1]!.replace(/\\\\$/, '');
  return ['\\par\\smallskip', ...lines];
}

function cellLines(
  latexPackage: LatexPackage,
  item: PreparedPosition,
  index: number,
  options: BoardLineOptions & { numbering: boolean; pieceCount: boolean }
): string[] {
  const boardOptions: BoardLineOptions = { ...options, flipped: item.flipped };

  if (latexPackage === 'diagram') {
    return diagramLines(item.fen, {
      author: item.author,
      source: item.source,
      award: item.award,
      stipulation: item.stipulation,
      remark: item.remark,
    });
  }

  const board =
    latexPackage === 'skak'
      ? skakLines(item.fen, boardOptions)
      : chessboardLines(item.fen, item.position, boardOptions);

  return [
    ...board,
    ...captionLines(item, index, options.numbering, options.pieceCount),
  ];
}

function columnWidth(columns: number): string {
  const width = (1 - COLUMN_GAP_RATIO * (columns - 1)) / columns;
  return `${width.toFixed(3)}\\linewidth`;
}

function layoutCells(cells: string[][], columns: number): string[] {
  if (columns === 1) {
    return cells.flatMap((cell) => [
      '\\begin{center}',
      ...cell,
      '\\end{center}',
    ]);
  }

  const width = columnWidth(columns);
  const lines: string[] = [];
  cells.forEach((cell, index) => {
    const column = index % columns;
    const last = column === columns - 1 || index === cells.length - 1;
    if (column === 0) lines.push('\\noindent');
    lines.push(`\\begin{minipage}[t]{${width}}\\centering`, ...cell);
    lines.push(last ? '\\end{minipage}' : '\\end{minipage}\\hfill');
    if (last) lines.push('\\par\\bigskip');
  });
  return lines;
}

function solutionLines(items: PreparedPosition[], enabled: boolean): string[] {
  const solved = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.solution);
  if (!enabled || !solved.length) return [];
  return [
    '\\section*{Solutions}',
    ...solved.map(
      ({ item, index }) =>
        `\\noindent${numberLabel(index)}\\quad ${item.solution}\\par\\medskip`
    ),
  ];
}

function packageLine(latexPackage: LatexPackage, size: LatexBoardSize): string {
  if (latexPackage !== 'diagram') {
    return LATEX_PACKAGE_META[latexPackage].usePackage;
  }
  return `\\usepackage[${LATEX_DIAGRAM_SIZE_PT[size]}pt]{diagram}`;
}

function schwaLines(texts: string[]): string[] {
  if (!texts.some((text) => text.includes(SCHWA_LOWER) || text.includes(SCHWA_UPPER))) {
    return [];
  }
  return [
    '\\usepackage{graphicx}',
    '\\DeclareUnicodeCharacter{0259}{\\rotatebox[origin=c]{180}{e}}',
    '\\DeclareUnicodeCharacter{018F}{\\scalebox{1.5}[1.45]{\\rotatebox[origin=c]{180}{e}}}',
  ];
}

export function generateLatexDocument(config: LatexDocumentConfig): string {
  if (!config) fail('config is null or undefined');
  if (!Array.isArray(config.positions) || !config.positions.length) {
    fail('at least one position is required');
  }
  if (config.positions.length > LATEX_MAX_POSITIONS) {
    fail(`too many positions (maximum ${LATEX_MAX_POSITIONS})`);
  }

  const latexPackage = resolvePackage(config.latexPackage);
  const size = resolveBoardSize(config.boardSize);
  const mode = pick(
    ['snippet', 'document', 'standalone'] as const,
    config.mode,
    'snippet',
    'output mode'
  );
  const columns = boundedInteger(
    config.columns,
    LATEX_COLUMN_RANGE,
    1,
    'columns'
  );
  const items = config.positions.map((position) =>
    preparePosition(position, config.flipped ?? false)
  );
  const numbering = config.numbering ?? items.length > 1;
  const pieceCount = config.pieceCount ?? false;

  const cells = items.map((item, index) =>
    cellLines(latexPackage, item, index, {
      flipped: item.flipped,
      showCoords: config.showCoords !== false,
      showMover: config.showMover !== false,
      size,
      numbering,
      pieceCount,
    })
  );

  const bare = items.length === 1 && columns === 1 && mode === 'snippet';
  const body = bare ? cells[0]! : layoutCells(cells, columns);

  const colors = LATEX_PACKAGE_META[latexPackage].supportsMarks
    ? [
        ...new Set(
          config.positions.flatMap((position) => positionColors(position))
        ),
      ].map(colorDefinition)
    : [];
  const diagramNumbering =
    latexPackage === 'diagram' && !numbering ? ['\\nodiagnumbering'] : [];
  const setup = [
    packageLine(latexPackage, size),
    ...colors,
    ...diagramNumbering,
  ];

  if (mode === 'snippet') {
    return [...setup, ...body, ...solutionLines(items, config.solutions === true)].join('\n');
  }

  const fontSize = pick(LATEX_FONT_SIZES, config.fontSize, 11, 'font size');
  const paper = pick(LATEX_PAPER_SIZES, config.paper, 'a4', 'paper size');
  const documentClass = pick(
    LATEX_DOCUMENT_CLASSES,
    config.documentClass,
    'article',
    'document class'
  );
  const marginMm = boundedInteger(
    config.marginMm,
    LATEX_MARGIN_RANGE_MM,
    20,
    'margin'
  );
  const title = cleanText(config.title, 'title');
  const documentAuthor = cleanText(config.documentAuthor, 'author');

  const classLine =
    mode === 'standalone'
      ? `\\documentclass[border=${STANDALONE_BORDER_PT}pt,varwidth=${STANDALONE_WIDTH_MM}mm]{standalone}`
      : `\\documentclass[${fontSize}pt,${PAPER_OPTION[paper]}]{${documentClass}}`;

  const texts = [
    title,
    documentAuthor,
    ...items.flatMap((item) => [
      item.caption,
      item.author,
      item.source,
      item.award,
      item.stipulation,
      item.remark,
      item.solution,
    ]),
  ];

  const preamble = [
    classLine,
    '\\usepackage[T1]{fontenc}',
    '\\usepackage[utf8]{inputenc}',
    ...(mode === 'document' ? [`\\usepackage[margin=${marginMm}mm]{geometry}`] : []),
    ...schwaLines(texts),
    ...setup,
    '\\setlength{\\parindent}{0pt}',
  ];

  const titled = mode === 'document' && title !== '';
  if (titled) {
    preamble.push(
      `\\title{${title}}`,
      `\\author{${documentAuthor}}`,
      '\\date{}'
    );
  }

  return [
    ...preamble,
    '\\begin{document}',
    ...(titled ? ['\\maketitle'] : []),
    ...body,
    ...solutionLines(items, config.solutions === true),
    '\\end{document}',
  ].join('\n');
}
