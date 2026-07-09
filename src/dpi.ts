export async function changeDPI(blob: Blob, dpi: number, format: 'png' | 'jpeg'): Promise<Blob> {
  return format === 'png' ? changePngDPI(blob, dpi) : changeJpegDPI(blob, dpi);
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

async function changePngDPI(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const ppm = Math.round(dpi * 39.3701);
  const phys = new Uint8Array(21);
  phys.set([0, 0, 0, 9, 112, 72, 89, 115]);
  const dv = new DataView(phys.buffer);
  dv.setUint32(8, ppm);
  dv.setUint32(12, ppm);
  phys[16] = 1;
  let crc = 0xffffffff;
  for (let i = 4; i < 17; i++) crc = (crcTable[(crc ^ phys[i]!) & 0xff]!) ^ (crc >>> 8);
  dv.setUint32(17, crc ^ 0xffffffff);

  const chunks: Uint8Array[] = [bytes.slice(0, 8)];
  let pos = 8, inserted = false;
  while (pos < bytes.length) {
    const length = new DataView(bytes.buffer).getUint32(pos);
    const type = String.fromCharCode(...Array.from(bytes.slice(pos + 4, pos + 8)));
    if (!inserted && (type === 'IDAT' || type === 'PLTE')) { chunks.push(phys); inserted = true; }
    if (type !== 'pHYs') chunks.push(bytes.slice(pos, pos + 12 + length));
    pos += 12 + length;
  }
  if (!inserted) chunks.splice(chunks.length - 1, 0, phys);
  return new Blob(chunks as BlobPart[], { type: 'image/png' });
}

async function changeJpegDPI(blob: Blob, dpi: number): Promise<Blob> {
  dpi = Math.min(Math.max(Math.round(dpi), 1), 0xffff);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;

  let pos = 2;
  while (pos < bytes.length) {
    if (bytes[pos] !== 0xff) break;
    const marker = bytes[pos + 1];
    const l1 = bytes[pos + 2], l2 = bytes[pos + 3];
    if (l1 === undefined || l2 === undefined) break;
    const length = (l1 << 8) + l2;
    if (marker === 0xe0 && length >= 16) {
      const jfif = bytes.slice(pos, pos + 2 + length);
      jfif[13] = 1; jfif[14] = (dpi >> 8) & 0xff; jfif[15] = dpi & 0xff;
      jfif[16] = (dpi >> 8) & 0xff; jfif[17] = dpi & 0xff;
      const out = new Uint8Array(bytes.length);
      out.set(bytes.slice(0, pos)); out.set(jfif, pos);
      out.set(bytes.slice(pos + 2 + length), pos + 2 + length);
      return new Blob([out], { type: 'image/jpeg' });
    }
    if (marker === 0xda) break;
    pos += 2 + length;
  }

  const header = new Uint8Array([0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46,0x00,0x01,0x01,0x01,
    (dpi >> 8) & 0xff, dpi & 0xff, (dpi >> 8) & 0xff, dpi & 0xff, 0x00, 0x00]);
  const out = new Uint8Array(bytes.length + header.length);
  out.set(bytes.slice(0, 2)); out.set(header, 2); out.set(bytes.slice(2), 2 + header.length);
  return new Blob([out], { type: 'image/jpeg' });
}
