/**
 * Pure Node.js PNG generator for Rona extension icons
 * Creates a glowing obsidian & warm amber ambient ring icon.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createPng(size) {
  // RGBA buffer
  const width = size;
  const height = size;
  const buffer = Buffer.alloc(width * height * 4);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = width / 2;
  const ringRadius = width * 0.35;
  const ringThickness = width * 0.12;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Distance from the ring circle
      const distFromRing = Math.abs(dist - ringRadius);

      if (distFromRing < ringThickness) {
        // Core glow: Warm amber / radiant sunrise (#F59E0B -> #EC4899)
        const factor = 1 - distFromRing / ringThickness;
        const alpha = Math.min(255, Math.floor(factor * 255));
        buffer[idx] = 245;     // R
        buffer[idx + 1] = 158; // G
        buffer[idx + 2] = 11;  // B
        buffer[idx + 3] = alpha;
      } else if (dist < maxRadius) {
        // Soft outer ambient falloff
        const falloff = Math.max(0, 1 - dist / maxRadius);
        buffer[idx] = 236;     // R
        buffer[idx + 1] = 72;  // G
        buffer[idx + 2] = 153; // B
        buffer[idx + 3] = Math.floor(falloff * 60);
      } else {
        buffer[idx + 3] = 0; // Transparent
      }
    }
  }

  // Encode PNG
  // Raw scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let scanOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[scanOffset++] = 0; // Filter: None
    buffer.copy(scanlines, scanOffset, y * width * 4, (y + 1) * width * 4);
    scanOffset += width * 4;
  }

  const deflated = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve(__dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = createPng(size);
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Generated: ${filePath}`);
}
