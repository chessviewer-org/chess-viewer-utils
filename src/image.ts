export interface ImageDimensions {
  width: number;
  height: number;
}

export function readImageDimensions(data: Uint8Array | ArrayBuffer): ImageDimensions | null {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return readPng(bytes) ?? readJpeg(bytes);
}

function readPng(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: dv.getUint32(16), height: dv.getUint32(20) };
}

function readJpeg(bytes: Uint8Array): ImageDimensions | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 2;
  while (pos + 4 < bytes.length) {
    if (bytes[pos] !== 0xff) {
      pos++;
      continue;
    }
    const marker = bytes[pos + 1];
    if (marker === undefined) break;
    const isSOF =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSOF) {
      if (pos + 9 > bytes.length) return null;
      return { width: dv.getUint16(pos + 7), height: dv.getUint16(pos + 5) };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      pos += 2;
      continue;
    }
    const length = dv.getUint16(pos + 2);
    if (length < 2) return null;
    pos += 2 + length;
  }
  return null;
}

export function physicalSize(pixels: number, dpi: number): { inches: number; mm: number } {
  if (dpi <= 0) return { inches: 0, mm: 0 };
  const inches = pixels / dpi;
  return { inches, mm: inches * 25.4 };
}
