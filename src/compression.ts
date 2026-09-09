import {brotliCompressSync, brotliDecompressSync} from 'zlib';
import appConfig from './config';

export function compress(value: string): Buffer {
  const raw = Buffer.from(value, 'utf8');

  return appConfig.editorState.compression ? brotliCompressSync(raw) : raw;
}

export function decompress(blob: Buffer): string {
  return appConfig.editorState.compression
    ? brotliDecompressSync(blob).toString('utf8')
    : blob.toString('utf8');
}
