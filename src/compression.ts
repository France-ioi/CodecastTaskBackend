import {brotliCompressSync, brotliDecompressSync, constants} from 'zlib';
import appConfig from './config';

export function compress(value: string): Buffer {
  const raw = Buffer.from(value, 'utf8');

  return brotliCompressSync(raw, {params: {
      [constants.BROTLI_PARAM_QUALITY]: 5,
      [constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
    }});
}

export function decompress(blob: Buffer): string {
  return brotliDecompressSync(blob).toString('utf8');
}
