import {
  type BoardLineOptions,
  type DiagramFields,
  LATEX_DIAGRAM_SIZE_PT,
  LATEX_PACKAGE_META,
  type LatexBoardSize,
  type LatexCaptionStyle,
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
  resolveCaptionStyle,
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
  captionStyle?: LatexCaptionStyle;
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
  dedication: string;
  version: string;
  after: string;
  condition: string;
  twins: string;
  solution: string;
  white: string;
  black: string;
  event: string;
  date: string;
  captionStyle: LatexCaptionStyle;
}

interface CaptionOptions {
  numbering: boolean;
  pieceCount: boolean;
}

const BOARD_BOX = '\\cvboard';
const BOARD_WIDTH = '\\cvboardwidth';

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
  defaultFlipped: boolean,
  defaultStyle: LatexCaptionStyle
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
    dedication: cleanText(position.dedication, 'dedication'),
    version: cleanText(position.version, 'version'),
    after: cleanText(position.after, 'after'),
    condition: cleanText(position.condition, 'condition'),
    twins: cleanText(position.twins, 'twins'),
    solution: cleanText(position.solution, 'solution'),
    white: cleanText(position.white, 'white player'),
    black: cleanText(position.black, 'black player'),
    event: cleanText(position.event, 'event'),
    date: cleanText(position.date, 'date'),
    captionStyle: resolveCaptionStyle(position.captionStyle, defaultStyle),
  };
}

function numberLabel(index: number): string {
  return `\\textbf{No.~${index + 1}}`;
}

function classicLines(
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

  return [
    headline,
    credits ? `{\\small ${credits}}` : '',
    ...lineage(item),
    item.dedication ? `{\\small\\itshape ${item.dedication}}` : '',
    item.remark ? `{\\small\\itshape ${item.remark}}` : '',
    footer,
    ...problemTerms(item),
  ].filter(Boolean);
}

function lineage(item: PreparedPosition): string[] {
  return [item.after, item.version].map((text) =>
    text ? `{\\small\\itshape ${text}}` : ''
  );
}

function problemTerms(item: PreparedPosition): string[] {
  return [item.condition, item.twins].map((text) =>
    text ? `{\\small ${text}}` : ''
  );
}

function joined(parts: string[], separator: string): string {
  return parts.filter(Boolean).join(separator);
}

function stacked(lines: string[]): string {
  return lines.filter(Boolean).join('\\\\ ');
}

function countLabel(fen: string): string {
  const { white, black } = pieceCounts(fen);
  return `(${white}+${black})`;
}

function sideToMove(fen: string): string {
  return fen.split(' ')[1] === 'b' ? 'Black to move' : 'White to move';
}

function headline(item: PreparedPosition, index: number, numbering: boolean) {
  return joined(
    [numbering ? numberLabel(index) : '', item.caption],
    '\\quad '
  );
}

interface CaptionParts {
  above: string[];
  left: string;
  right: string;
  center: string;
  terms: string[];
}

function captionParts(
  item: PreparedPosition,
  index: number,
  options: CaptionOptions
): CaptionParts {
  const number = options.numbering ? numberLabel(index) : '';
  const count = options.pieceCount ? countLabel(item.fen) : '';
  const stipulation = item.stipulation ? `\\textbf{${item.stipulation}}` : '';
  const credits = [
    item.author ? `\\textbf{${item.author}}` : '',
    ...lineage(item),
    item.source ? `{\\small\\itshape ${item.source}}` : '',
    item.award ? `{\\small ${item.award}}` : '',
    item.dedication ? `{\\small\\itshape ${item.dedication}}` : '',
    item.remark ? `{\\small\\itshape ${item.remark}}` : '',
  ];
  const terms = problemTerms(item);
  const blank = { above: [], left: '', right: '', center: '', terms: [] };

  switch (item.captionStyle) {
    case 'problem':
      return {
        ...blank,
        above: [headline(item, index, options.numbering), ...credits],
        left: stipulation,
        right: count,
        terms,
      };
    case 'study':
      return {
        ...blank,
        above: [headline(item, index, options.numbering), ...credits],
        center: joined([stipulation, count], '\\quad '),
        terms,
      };
    case 'game':
      return {
        ...blank,
        above: [
          number,
          item.white || item.black
            ? `\\textbf{${joined([item.white, item.black], ' -- ')}}`
            : '',
          joined([item.event, item.date], ', ')
            ? `{\\small\\itshape ${joined([item.event, item.date], ', ')}}`
            : '',
          item.remark ? `{\\small\\itshape ${item.remark}}` : '',
        ],
        left: item.caption ? `{\\small ${item.caption}}` : '',
        right: `{\\small ${sideToMove(item.fen)}}`,
      };
    default:
      return {
        ...blank,
        above: [number],
        center: joined([stipulation, count], '\\quad '),
        terms,
      };
  }
}


interface FramedCell {
  above: string;
  board: string[];
  below: string;
}

function framedCell(
  item: PreparedPosition,
  index: number,
  board: string[],
  options: CaptionOptions
): FramedCell {
  if (item.captionStyle === 'classic') {
    return {
      above: '',
      board,
      below: classicLines(
        item,
        index,
        options.numbering,
        options.pieceCount
      ).join('\\par '),
    };
  }
  const parts = captionParts(item, index, options);
  return {
    above: parts.above.filter(Boolean).join('\\par '),
    board,
    below: [
      parts.left || parts.right
        ? `\\makebox[${BOARD_WIDTH}]{${parts.left}\\hfill ${parts.right}}`
        : parts.center,
      ...parts.terms,
    ]
      .filter(Boolean)
      .join('\\par '),
  };
}

function framedLayout(cells: FramedCell[], columns: number): string[] {
  const [first] = cells;
  if (!first) return [];
  const width = columns === 1 ? '\\linewidth' : columnWidth(columns);
  const spec = `@{\\extracolsep{\\fill}}*{${columns}}{>{\\centering\\arraybackslash}b{${width}}@{}}`;
  const lines = [
    `\\begin{lrbox}{${BOARD_BOX}}`,
    ...first.board,
    '\\end{lrbox}',
    `\\setlength{${BOARD_WIDTH}}{\\wd${BOARD_BOX}}`,
  ];

  for (let start = 0; start < cells.length; start += columns) {
    const row = cells.slice(start, start + columns);
    const padding = Array<string>(columns - row.length).fill('');
    const above = [...row.map((cell) => cell.above), ...padding];
    const below = [...row.map((cell) => cell.below), ...padding];

    lines.push('\\noindent', `\\begin{tabular*}{\\linewidth}{${spec}}`);
    if (above.some(Boolean)) lines.push(`${above.join(' & ')} \\\\[2pt]`);
    for (let column = 0; column < columns; column++) {
      lines.push(...(row[column]?.board ?? []));
      lines.push(column < columns - 1 ? '&' : '\\\\[2pt]');
    }
    if (below.some(Boolean)) lines.push(`${below.join(' & ')} \\\\`);
    lines.push('\\end{tabular*}', '\\par\\bigskip');
  }
  return lines;
}

const NO_DIAGRAM_FIELDS: DiagramFields = {
  author: '',
  source: '',
  award: '',
  stipulation: '',
  remark: '',
  dedication: '',
  version: '',
  after: '',
  condition: '',
  twins: '',
};

function diagramFields(item: PreparedPosition): DiagramFields {
  switch (item.captionStyle) {
    case 'game':
      return {
        ...NO_DIAGRAM_FIELDS,
        source: joined(
          [joined([item.white, item.black], ' -- '), item.event, item.date],
          ', '
        ),
        remark: joined([item.caption, item.remark], ' --- '),
      };
    case 'plain':
      return {
        ...NO_DIAGRAM_FIELDS,
        stipulation: item.stipulation,
        condition: item.condition,
        twins: item.twins,
      };
    default:
      return {
        author: item.author,
        source: item.source,
        award: item.award,
        stipulation: item.stipulation,
        remark: item.remark,
        dedication: item.dedication,
        version: item.version,
        after: item.after,
        condition: item.condition,
        twins: item.twins,
      };
  }
}

function captionLines(
  item: PreparedPosition,
  index: number,
  numbering: boolean,
  pieceCount: boolean
): string[] {
  const lines = classicLines(item, index, numbering, pieceCount);
  if (!lines.length) return lines;
  return [
    '\\par\\smallskip',
    ...lines.map((line, i) => (i < lines.length - 1 ? `${line}\\\\` : line)),
  ];
}

function cellLines(
  latexPackage: LatexPackage,
  item: PreparedPosition,
  index: number,
  options: BoardLineOptions & { numbering: boolean; pieceCount: boolean }
): string[] {
  const boardOptions: BoardLineOptions = { ...options, flipped: item.flipped };

  if (latexPackage === 'diagram') {
    return diagramLines(item.fen, diagramFields(item));
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
  const defaultStyle = resolveCaptionStyle(config.captionStyle, 'classic');
  const items = config.positions.map((position) =>
    preparePosition(position, config.flipped ?? false, defaultStyle)
  );
  const numbering = config.numbering ?? items.length > 1;
  const pieceCount = config.pieceCount ?? false;

  const boardOptions = {
    showCoords: config.showCoords !== false,
    showMover: config.showMover !== false,
    size,
  };
  const framed =
    latexPackage !== 'diagram' &&
    items.some((item) => item.captionStyle !== 'classic');

  let body: string[];
  if (framed) {
    body = framedLayout(
      items.map((item, index) =>
        framedCell(
          item,
          index,
          latexPackage === 'skak'
            ? skakLines(item.fen, { ...boardOptions, flipped: item.flipped })
            : chessboardLines(item.fen, item.position, {
                ...boardOptions,
                flipped: item.flipped,
              }),
          { numbering, pieceCount }
        )
      ),
      columns
    );
  } else {
    const cells = items.map((item, index) =>
      cellLines(latexPackage, item, index, {
        ...boardOptions,
        flipped: item.flipped,
        numbering,
        pieceCount,
      })
    );
    const bare = items.length === 1 && columns === 1 && mode === 'snippet';
    body = bare ? cells[0]! : layoutCells(cells, columns);
  }

  const colors = LATEX_PACKAGE_META[latexPackage].supportsMarks
    ? [
        ...new Set(
          config.positions.flatMap((position) => positionColors(position))
        ),
      ].map(colorDefinition)
    : [];
  const diagramSetup =
    latexPackage === 'diagram'
      ? ['\\nocomputer', ...(numbering ? [] : ['\\nodiagnumbering'])]
      : [];
  const title = cleanText(config.title, 'title');
  const documentAuthor = cleanText(config.documentAuthor, 'author');
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
      item.dedication,
      item.version,
      item.after,
      item.condition,
      item.twins,
      item.solution,
      item.white,
      item.black,
      item.event,
      item.date,
    ]),
  ];
  const setup = [
    packageLine(latexPackage, size),
    ...colors,
    ...diagramSetup,
    ...(framed
      ? [
          '\\usepackage{array}',
          `\\newsavebox{${BOARD_BOX}}`,
          `\\newlength{${BOARD_WIDTH}}`,
        ]
      : []),
  ];

  if (mode === 'snippet') {
    setup.splice(1, 0, ...schwaLines(texts));
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
  const classLine =
    mode === 'standalone'
      ? `\\documentclass[border=${STANDALONE_BORDER_PT}pt,varwidth=${STANDALONE_WIDTH_MM}mm]{standalone}`
      : `\\documentclass[${fontSize}pt,${PAPER_OPTION[paper]}]{${documentClass}}`;

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
