import {brotliCompressSync, brotliDecompressSync} from 'zlib';

// A compressed value is stored as one marker byte telling how the rest of the blob was encoded,
// followed by the encoded value itself. Storing the marker means the algorithm can be changed later
// without having to migrate the rows that were written with the previous one.
const compressionMethodNone = 0;
const compressionMethodBrotli = 1;

/**
 * Compresses a value for storage in a blob column. Brotli was measured as the best of gzip, raw
 * deflate and brotli on both the editor states and the patches between two of them. Small values
 * can still come out bigger than they went in, they are then stored as they are.
 */
export function compress(value: string): Buffer {
  const raw = Buffer.from(value, 'utf8');
  const compressed = brotliCompressSync(raw);

  return compressed.length < raw.length
    ? Buffer.concat([Buffer.from([compressionMethodBrotli]), compressed])
    : Buffer.concat([Buffer.from([compressionMethodNone]), raw]);
}

export function decompress(blob: Buffer): string {
  if (0 === blob.length) {
    throw new Error('Cannot decompress an empty blob');
  }

  const payload = blob.subarray(1);
  switch (blob[0]) {
    case compressionMethodNone:
      return payload.toString('utf8');
    case compressionMethodBrotli:
      return brotliDecompressSync(payload).toString('utf8');
    default:
      throw new Error(`Unknown compression method: ${blob[0]}`);
  }
}
