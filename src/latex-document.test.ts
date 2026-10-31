import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  LATEX_PACKAGES,
  escapeLatex,
  generateBoardLatex,
  generateLatexDocument,
  pieceCounts
} from './latex.ts';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const ENDGAME_FEN = '8/8/8/3k4/8/4K3/3Q4/8 w - - 0 1';

function lines(text: string): string[] {
  return text.split('\n');
}

describe('escapeLatex', () => {
  test('escapes every LaTeX special character', () => {
    assert.equal(
      escapeLatex('a & b % c $ d # e _ f { g } h ~ i ^ j \\ k'),
      'a \\& b \\% c \\$ d \\# e \\_ f \\{ g \\} h \\textasciitilde{} i \\textasciicircum{} j \\textbackslash{} k'
    );
  });

  test('turns line breaks into LaTeX line breaks', () => {
    assert.equal(escapeLatex('a\nb'), 'a\\\\ b');
  });

  test('drops control characters', () => {
    assert.equal(escapeLatex('a\u0000b\u0007c'), 'abc');
  });

  test('leaves ordinary and unicode text untouched', () => {
    assert.equal(escapeLatex('Şahmat 1.e4!'), 'Şahmat 1.e4!');
  });
});

describe('pieceCounts', () => {
  test('counts white and black pieces from the placement field', () => {
    assert.deepEqual(pieceCounts(START_FEN), { white: 16, black: 16 });
    assert.deepEqual(pieceCounts(ENDGAME_FEN), { white: 2, black: 1 });
  });
});

describe('multi-position documents', () => {
  const positions = [
    { fen: START_FEN, stipulation: '#2', author: 'Loyd, Sam' },
    { fen: ENDGAME_FEN, stipulation: 'h#3' }
  ];

  test('requires at least one position', () => {
    assert.throws(() => generateLatexDocument({ positions: [] }), /position/);
  });

  test('rejects an invalid FEN in any position', () => {
    assert.throws(
      () =>
        generateLatexDocument({
          positions: [{ fen: START_FEN }, { fen: 'not a fen' }]
        }),
      /LaTeX export failed/
    );
  });

  test('numbers boards and prints stipulation with the piece count', () => {
    const latex = generateLatexDocument({
      positions,
      latexPackage: 'skak',
      pieceCount: true
    });
    assert.match(latex, /\\textbf\{No\.~1\}/);
    assert.match(latex, /\\textbf\{No\.~2\}/);
    assert.match(latex, /\\textbf\{\\#2\}\\quad \(16\+16\)/);
    assert.match(latex, /\\textbf\{h\\#3\}\\quad \(2\+1\)/);
  });

  test('numbering can be switched off', () => {
    const latex = generateLatexDocument({ positions, numbering: false });
    assert.doesNotMatch(latex, /No\.~/);
  });

  test('lays boards out in the requested number of columns', () => {
    const latex = generateLatexDocument({ positions, columns: 2 });
    assert.equal(latex.match(/\\begin\{minipage\}/g)?.length, 2);
    assert.match(latex, /\\end\{minipage\}\\hfill/);
    assert.match(latex, /0\.490\\linewidth/);
  });

  test('rejects an out-of-range column count', () => {
    assert.throws(
      () => generateLatexDocument({ positions, columns: 9 }),
      /columns/
    );
    assert.throws(
      () => generateLatexDocument({ positions, columns: 1.5 }),
      /columns/
    );
  });

  test('prints a solutions section only when asked and available', () => {
    const solved = [{ fen: START_FEN, solution: '1.Qh5 & 2.Qxf7#' }, positions[1]!];
    const withSolutions = generateLatexDocument({
      positions: solved,
      solutions: true
    });
    assert.match(withSolutions, /\\section\*\{Solutions\}/);
    assert.match(withSolutions, /1\.Qh5 \\& 2\.Qxf7\\#/);
    assert.doesNotMatch(
      generateLatexDocument({ positions: solved }),
      /Solutions/
    );
    assert.doesNotMatch(
      generateLatexDocument({ positions, solutions: true }),
      /Solutions/
    );
  });

  test('escapes user text so it cannot inject markup', () => {
    const latex = generateLatexDocument({
      positions: [
        { fen: START_FEN, caption: '\\input{/etc/passwd} 100% {x}' }
      ]
    });
    assert.doesNotMatch(latex, /\\input\{/);
    assert.match(latex, /\\textbackslash\{\}input\\\{\/etc\/passwd\\\} 100\\% \\\{x\\\}/);
  });

  test('rejects text longer than the limit', () => {
    assert.throws(
      () =>
        generateLatexDocument({
          positions: [{ fen: START_FEN, caption: 'x'.repeat(2001) }]
        }),
      /caption/
    );
  });
});

describe('document and standalone modes', () => {
  test('document mode honours class, paper, font size and margin', () => {
    const latex = generateLatexDocument({
      positions: [{ fen: START_FEN }],
      mode: 'document',
      documentClass: 'book',
      paper: 'a5',
      fontSize: 12,
      marginMm: 15
    });
    const first = lines(latex);
    assert.equal(first[0], '\\documentclass[12pt,a5paper]{book}');
    assert.ok(first.includes('\\usepackage[margin=15mm]{geometry}'));
    assert.ok(first.includes('\\begin{document}'));
    assert.equal(first.at(-1), '\\end{document}');
  });

  test('document mode adds a title page when a title is given', () => {
    const latex = generateLatexDocument({
      positions: [{ fen: START_FEN }],
      mode: 'document',
      title: 'Endgames & Studies',
      documentAuthor: 'A. Composer'
    });
    assert.match(latex, /\\title\{Endgames \\& Studies\}/);
    assert.match(latex, /\\author\{A\. Composer\}/);
    assert.match(latex, /\\maketitle/);
  });

  test('standalone mode produces a cropped class without geometry', () => {
    const latex = generateLatexDocument({
      positions: [{ fen: START_FEN }],
      mode: 'standalone'
    });
    assert.match(
      latex,
      /^\\documentclass\[border=6pt,varwidth=170mm\]\{standalone\}/
    );
    assert.doesNotMatch(latex, /geometry/);
  });

  test('rejects unknown classes, papers and font sizes', () => {
    const base = { positions: [{ fen: START_FEN }], mode: 'document' as const };
    assert.throws(
      () => generateLatexDocument({ ...base, documentClass: 'memoir' as never }),
      /document class/
    );
    assert.throws(
      () => generateLatexDocument({ ...base, paper: 'a0' as never }),
      /paper size/
    );
    assert.throws(
      () => generateLatexDocument({ ...base, fontSize: 14 as never }),
      /font size/
    );
    assert.throws(
      () => generateLatexDocument({ ...base, marginMm: 500 }),
      /margin/
    );
  });

  test('declares the schwa only when the text uses it', () => {
    const plain = generateLatexDocument({
      positions: [{ fen: START_FEN, author: 'Smith' }],
      mode: 'document'
    });
    const azeri = generateLatexDocument({
      positions: [{ fen: START_FEN, author: 'Əliyev' }],
      mode: 'document'
    });
    assert.doesNotMatch(plain, /DeclareUnicodeCharacter/);
    assert.match(azeri, /DeclareUnicodeCharacter\{0259\}/);
    assert.match(azeri, /DeclareUnicodeCharacter\{018F\}/);
    assert.match(azeri, /\\usepackage\{graphicx\}/);
  });

  test('declares the schwa in snippets, before the package setup ends', () => {
    const snippet = lines(
      generateLatexDocument({
        positions: [{ fen: START_FEN, author: 'Rəşad Əliyev' }],
        mode: 'snippet'
      })
    );
    const declared = snippet.findIndex((line) =>
      line.startsWith('\\DeclareUnicodeCharacter{0259}')
    );
    assert.ok(declared > 0);
    assert.ok(declared < snippet.indexOf('\\fenboard{' + START_FEN + '}'));
  });
});

describe('chessboard marks', () => {
  const marked = {
    fen: START_FEN,
    highlights: [
      { square: 'e4' },
      { square: 'd5', style: 'ring' as const, color: '#e8412c' }
    ],
    arrows: [{ from: 'e2', to: 'e4' }]
  };

  test('emits mark keys and colour definitions for chessboard', () => {
    const latex = generateBoardLatex({ ...marked, latexPackage: 'chessboard' });
    assert.match(latex, /\\definecolor\{cvFFEB3B\}\{HTML\}\{FFEB3B\}/);
    assert.match(latex, /\\definecolor\{cvE8412C\}\{HTML\}\{E8412C\}/);
    assert.match(latex, /pgfstyle=color,\n {2}color=cvFFEB3B!55,\n {2}backfields=\{e4\}/);
    assert.match(latex, /pgfstyle=circle,\n {2}color=cvE8412C,\n {2}markfields=\{d5\}/);
    assert.match(latex, /pgfstyle=straightmove,\n {2}color=cv15781B,\n {2}markmoves=\{e2-e4\}/);
  });

  test('groups squares that share a style and colour', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard',
      highlights: [{ square: 'a1' }, { square: 'b2' }]
    });
    assert.match(latex, /backfields=\{a1,b2\}/);
    assert.equal(latex.match(/backfields/g)?.length, 1);
  });

  test('draws filled squares behind the pieces and rings above them', () => {
    const latex = generateBoardLatex({ ...marked, latexPackage: 'chessboard' });
    assert.doesNotMatch(latex, /markfields=\{e4\}/);
    assert.match(latex, /backfields=\{e4\}/);
    assert.match(latex, /markfields=\{d5\}/);
  });

  test('rejects colours that are not six-digit hex', () => {
    assert.throws(
      () =>
        generateBoardLatex({
          fen: START_FEN,
          latexPackage: 'chessboard',
          arrows: [{ from: 'a1', to: 'a2', color: '#f00' }]
        }),
      /invalid arrow/
    );
  });

  test('marks are ignored by packages that cannot draw them', () => {
    for (const latexPackage of ['skak', 'diagram'] as const) {
      const latex = generateBoardLatex({ ...marked, latexPackage });
      assert.doesNotMatch(latex, /definecolor|markfields|markmoves/);
    }
  });

  test('rejects invalid squares and arrows', () => {
    assert.throws(
      () =>
        generateBoardLatex({
          fen: START_FEN,
          latexPackage: 'chessboard',
          highlights: [{ square: 'z9' }]
        }),
      /invalid highlight/
    );
    assert.throws(
      () =>
        generateBoardLatex({
          fen: START_FEN,
          latexPackage: 'chessboard',
          arrows: [{ from: 'e2', to: 'e2' }]
        }),
      /invalid arrow/
    );
  });
});

describe('diagram package', () => {
  test('wraps a position in the diagram environment with metadata', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'diagram',
      author: 'Loyd, Sam',
      source: 'Chess Monthly',
      award: '1st Prize',
      stipulation: '#2',
      remark: 'Dedicated'
    });
    assert.deepEqual(lines(latex), [
      '\\usepackage[11pt]{diagram}',
      '\\nocomputer',
      '\\nodiagnumbering',
      '\\begin{diagram}',
      '\\author{Loyd, Sam}',
      '\\source{Chess Monthly}',
      '\\award{1st Prize}',
      '\\remark{Dedicated}',
      '\\stipulation{\\#2}',
      '\\fen[16+16]{rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR}',
      '\\end{diagram}'
    ]);
  });

  test('passes only the placement field so castling letters are not read as pieces', () => {
    const latex = generateBoardLatex({ fen: START_FEN, latexPackage: 'diagram' });
    assert.doesNotMatch(latex, /KQkq/);
  });

  test('rewrites "First Last" authors into the "Surname, First" form', () => {
    const latex = generateBoardLatex({
      fen: ENDGAME_FEN,
      latexPackage: 'diagram',
      author: 'Leonid Kubbel; Anonymous'
    });
    assert.match(latex, /\\author\{Kubbel, Leonid; Anonymous, \}/);
  });

  test('maps board size to the diagram font options', () => {
    const sizes = { tiny: 10, small: 10, normal: 11, large: 12 } as const;
    for (const [boardSize, pt] of Object.entries(sizes)) {
      const latex = generateBoardLatex({
        fen: ENDGAME_FEN,
        latexPackage: 'diagram',
        boardSize: boardSize as keyof typeof sizes
      });
      assert.match(latex, new RegExp(`\\\\usepackage\\[${pt}pt\\]\\{diagram\\}`));
    }
  });

  test('hides the computer-tested marker the package prints by default', () => {
    const latex = generateLatexDocument({
      latexPackage: 'diagram',
      mode: 'document',
      positions: [{ fen: START_FEN }, { fen: ENDGAME_FEN }]
    });
    assert.match(latex, /\\nocomputer/);
    assert.ok(latex.indexOf('\\nocomputer') < latex.indexOf('\\begin{document}'));
  });

  test('keeps numbering when several diagrams are exported', () => {
    const latex = generateLatexDocument({
      latexPackage: 'diagram',
      positions: [{ fen: START_FEN }, { fen: ENDGAME_FEN }]
    });
    assert.doesNotMatch(latex, /nodiagnumbering/);
    assert.equal(latex.match(/\\begin\{diagram\}/g)?.length, 2);
  });
});

describe('every package accepts the full option set', () => {
  test('generates without throwing', () => {
    for (const latexPackage of LATEX_PACKAGES) {
      for (const mode of ['snippet', 'document', 'standalone'] as const) {
        const latex = generateLatexDocument({
          latexPackage,
          mode,
          columns: 2,
          pieceCount: true,
          solutions: true,
          positions: [
            { fen: START_FEN, caption: 'One', solution: '1.e4' },
            { fen: ENDGAME_FEN, flipped: true }
          ]
        });
        assert.equal(latex, latex.trimEnd());
      }
    }
  });
});

describe('position limit', () => {
  test('accepts up to 100 positions and rejects more', () => {
    const fen = '8/8/8/3k4/8/4K3/3Q4/8 w - - 0 1';
    const many = (count: number) => Array.from({ length: count }, () => ({ fen }));
    assert.doesNotThrow(() => generateLatexDocument({ positions: many(100) }));
    assert.throws(
      () => generateLatexDocument({ positions: many(101) }),
      /too many positions \(maximum 100\)/
    );
  });
});

describe('caption styles', () => {
  const problem = {
    fen: ENDGAME_FEN,
    author: 'Loyd, Sam',
    source: 'Chess Monthly',
    award: '1st Prize',
    stipulation: '#2'
  };
  const game = {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4',
    white: 'Kasparov',
    black: 'Topalov',
    event: 'Wijk aan Zee',
    date: '1999',
    caption: 'after 4.Nf3'
  };

  test('keeps the classic captions unless a style is chosen', () => {
    const latex = generateLatexDocument({ positions: [problem, problem] });
    assert.doesNotMatch(latex, /tabular\*|cvboard/);
  });

  test('puts the count bottom-left and the stipulation bottom-right in problem style', () => {
    const latex = generateLatexDocument({
      captionStyle: 'problem',
      pieceCount: true,
      positions: [problem]
    });
    assert.match(latex, /\\makebox\[\\cvboardwidth\]\{\(2\+1\)\\hfill \\textbf\{\\#2\}\}/);
    assert.match(latex, /\\textbf\{Loyd, Sam\}\\par \{\\small\\itshape Chess Monthly\}/);
    assert.match(latex, /\\usepackage\{array\}/);
    assert.match(latex, /\\newsavebox\{\\cvboard\}/);
  });

  test('prints players, event and the side to move in game style', () => {
    const latex = generateLatexDocument({
      captionStyle: 'game',
      positions: [game]
    });
    assert.match(latex, /\\textbf\{Kasparov -- Topalov\}/);
    assert.match(latex, /\{\\small\\itshape Wijk aan Zee, 1999\}/);
    assert.match(latex, /after 4\.Nf3\}\\hfill \{\\small Black to move\}/);
  });

  test('centres stipulation and count in study style', () => {
    const latex = generateLatexDocument({
      captionStyle: 'study',
      pieceCount: true,
      positions: [{ ...problem, stipulation: 'Win' }]
    });
    assert.match(latex, /\\textbf\{Win\}\\quad \(2\+1\)/);
    assert.doesNotMatch(latex, /\\hfill/);
  });

  test('lets a position override the document style', () => {
    const latex = generateLatexDocument({
      captionStyle: 'problem',
      columns: 2,
      positions: [problem, { ...game, captionStyle: 'game' }]
    });
    assert.match(latex, /Kasparov -- Topalov/);
    assert.match(latex, /\\textbf\{Loyd, Sam\}/);
  });

  test('aligns every board of a row in one table row', () => {
    const latex = lines(
      generateLatexDocument({
        captionStyle: 'plain',
        columns: 3,
        positions: [problem, problem, problem, problem]
      })
    );
    assert.equal(latex.filter((line) => line.startsWith('\\begin{tabular*}')).length, 2);
    assert.equal(latex.filter((line) => line === '&').length, 4);
  });

  test('maps game details onto the diagram package fields', () => {
    const latex = generateLatexDocument({
      latexPackage: 'diagram',
      captionStyle: 'game',
      positions: [game]
    });
    assert.match(latex, /\\source\{Kasparov -- Topalov, Wijk aan Zee, 1999\}/);
    assert.doesNotMatch(latex, /\\author/);
    assert.doesNotMatch(latex, /tabular\*/);
  });

  test('rejects unknown styles', () => {
    assert.throws(
      () =>
        generateLatexDocument({
          captionStyle: 'fancy' as never,
          positions: [problem]
        }),
      /caption style/
    );
  });
});
