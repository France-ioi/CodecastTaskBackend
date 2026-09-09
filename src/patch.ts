import diff from 'fast-diff';

// A patch is a JSON array of operations that rebuilds a target string from a source string. It is
// read from left to right with a cursor placed at the beginning of the source:
//   a positive number   copies that many characters of the source and advances the cursor
//   a negative number   skips that many characters of the source
//   a string            inserts it, the cursor does not move
// Deleted text is stored as a length rather than as its characters, and unchanged text costs a
// number whatever its length, which is what keeps a patch small: a one character edit in the middle
// of a large state comes out as three operations. Applying a patch requires the exact source it was
// created from, which the reader always has, since it walks the chain of patches from the newest
// state backwards.
type PatchOperation = number|string;

/**
 * Builds the patch that rebuilds `target` from `source`.
 */
export function createPatch(source: string, target: string): string {
  const operations: PatchOperation[] = [];

  for (const [operation, text] of diff(source, target)) {
    switch (operation) {
      case diff.EQUAL:
        operations.push(text.length);
        break;
      case diff.DELETE:
        operations.push(-text.length);
        break;
      case diff.INSERT:
        operations.push(text);
        break;
    }
  }

  return JSON.stringify(operations);
}

export function applyPatch(source: string, patch: string): string {
  const operations = JSON.parse(patch) as unknown;
  if (!Array.isArray(operations)) {
    throw new Error('Malformed patch: expected an array of operations');
  }

  let cursor = 0;
  let target = '';

  for (const operation of operations as unknown[]) {
    if ('string' === typeof operation) {
      target += operation;
      continue;
    }

    if ('number' !== typeof operation || !Number.isInteger(operation)) {
      throw new Error(`Malformed patch: unexpected operation ${JSON.stringify(operation)}`);
    }

    const length = Math.abs(operation);
    if (cursor + length > source.length) {
      throw new Error('The patch does not apply: it reads past the end of the source');
    }

    if (0 < operation) {
      target += source.substr(cursor, length);
    }
    cursor += length;
  }

  if (cursor !== source.length) {
    throw new Error(`The patch does not apply: it covers ${cursor} of the ${source.length} characters of the source`);
  }

  return target;
}
