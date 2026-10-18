import assert from 'node:assert/strict';
import { test } from 'node:test';

import { changeDPI } from './dpi.ts';

const JFIF_APP0 = [
  0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
];
const SOS_AND_EOI = [0xff, 0xda, 0x00, 0x02, 0xff, 0xd9];

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function readJfif(bytes: Uint8Array) {
  assert.equal(bytes[2], 0xff);
  assert.equal(bytes[3], 0xe0);
  return {
    units: bytes[13],
    xDensity: (bytes[14]! << 8) | bytes[15]!,
    yDensity: (bytes[16]! << 8) | bytes[17]!,
    thumbWidth: bytes[18],
    thumbHeight: bytes[19],
  };
}

test('changeDPI rewrites an existing JFIF segment as dots per inch', async () => {
  const jpeg = new Blob([new Uint8Array([0xff, 0xd8, ...JFIF_APP0, ...SOS_AND_EOI])]);
  const out = await bytesOf(await changeDPI(jpeg, 300, 'jpeg'));
  assert.deepEqual(readJfif(out), {
    units: 1,
    xDensity: 300,
    yDensity: 300,
    thumbWidth: 0,
    thumbHeight: 0,
  });
  assert.equal(out.length, 2 + JFIF_APP0.length + SOS_AND_EOI.length);
});

test('changeDPI inserts a JFIF segment when the JPEG has none', async () => {
  const jpeg = new Blob([new Uint8Array([0xff, 0xd8, ...SOS_AND_EOI])]);
  const out = await bytesOf(await changeDPI(jpeg, 1200, 'jpeg'));
  assert.deepEqual(readJfif(out), {
    units: 1,
    xDensity: 1200,
    yDensity: 1200,
    thumbWidth: 0,
    thumbHeight: 0,
  });
});

test('changeDPI writes a pHYs chunk in pixels per metre before IDAT', async () => {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const chunk = (type: string, data: number[] = []) => [
    0, 0, 0, data.length, ...Array.from(type, (c) => c.charCodeAt(0)), ...data, 0, 0, 0, 0,
  ];
  const png = new Blob([
    new Uint8Array([...signature, ...chunk('IHDR', new Array(13).fill(0)), ...chunk('IDAT'), ...chunk('IEND')]),
  ]);
  const out = await bytesOf(await changeDPI(png, 600, 'png'));
  const text = String.fromCharCode(...out);
  const phys = text.indexOf('pHYs');
  assert.ok(phys > 0 && phys < text.indexOf('IDAT'));
  const view = new DataView(out.buffer);
  assert.equal(view.getUint32(phys + 4), Math.round(600 * 39.3701));
  assert.equal(view.getUint32(phys + 8), Math.round(600 * 39.3701));
  assert.equal(out[phys + 12], 1);
});
