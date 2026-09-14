import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {applyPatch, createPatch} from '../src/patch';

function assertRoundTrip(source: string, target: string): void {
  assert.equal(applyPatch(source, createPatch(source, target)), target);
}

// Deterministic pseudo-random generator, so that a failing case can be replayed
function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;

    return state / 2147483648;
  };
}

describe('applyPatch', () => {
  describe('operations', () => {
    it('copies the source when the patch only copies it', () => {
      assert.equal(applyPatch('hello', '[5]'), 'hello');
    });

    it('skips the characters of a negative operation', () => {
      assert.equal(applyPatch('hello world', '[5,-6]'), 'hello');
      assert.equal(applyPatch('hello world', '[-6,5]'), 'world');
    });

    it('inserts strings without moving the cursor', () => {
      assert.equal(applyPatch('ac', '[1,"b",1]'), 'abc');
      assert.equal(applyPatch('', '["new"]'), 'new');
    });

    it('replaces text by skipping it and inserting the new one', () => {
      assert.equal(applyPatch('total = 0', '[8,-1,"42"]'), 'total = 42');
    });

    it('rebuilds an empty string from an empty source with an empty patch', () => {
      assert.equal(applyPatch('', '[]'), '');
    });

    it('accepts operations of zero length', () => {
      assert.equal(applyPatch('abc', '[0,3,-0,""]'), 'abc');
    });

    it('counts lengths in UTF-16 code units', () => {
      // "é" is one code unit, the emoji is two
      assert.equal(applyPatch('é😀x', '[3,-1,"y"]'), 'é😀y');
    });
  });

  describe('malformed patches', () => {
    it('rejects a patch which is not JSON', () => {
      assert.throws(() => applyPatch('abc', '[3'), SyntaxError);
    });

    for (const patch of ['{}', '3', '"abc"', 'null']) {
      it(`rejects ${patch} since a patch must be an array`, () => {
        assert.throws(() => applyPatch('abc', patch), /Malformed patch: expected an array of operations/);
      });
    }

    for (const operation of ['1.5', 'null', 'true', '{}', '[3]']) {
      it(`rejects the operation ${operation}`, () => {
        assert.throws(() => applyPatch('abc', `[${operation}]`), /Malformed patch: unexpected operation/);
      });
    }
  });

  describe('patches which do not apply to the source', () => {
    it('rejects a copy past the end of the source', () => {
      assert.throws(() => applyPatch('abc', '[4]'), /reads past the end of the source/);
    });

    it('rejects a skip past the end of the source', () => {
      assert.throws(() => applyPatch('abc', '[2,-2]'), /reads past the end of the source/);
    });

    it('rejects a patch which does not cover the whole source', () => {
      assert.throws(() => applyPatch('abcdef', '[3]'), /it covers 3 of the 6 characters of the source/);
    });

    it('rejects a patch applied to a source other than the one it was created from', () => {
      const patch = createPatch('def f():\n    return 1', 'def f():\n    return 2');

      assert.throws(() => applyPatch('def f():\n    return 10', patch), /does not apply/);
    });
  });

  describe('with createPatch', () => {
    const cases: [string, string, string][] = [
      ['identical strings', 'print(1)', 'print(1)'],
      ['from an empty string', '', 'print(1)'],
      ['to an empty string', 'print(1)', ''],
      ['an insertion in the middle', 'def f():\n    return n', 'def f(n):\n    return n'],
      ['a deletion', 'a = 1\nb = 2\nc = 3', 'a = 1\nc = 3'],
      ['a completely different text', 'abc', 'xyz'],
      ['accents', 'resultat = 0', 'résultat = 0'],
      ['an emoji replaced by another one sharing its high surrogate', 'print("😀")', 'print("😃")'],
      ['quotes, backslashes and escaped newlines', '{"source":["a\\"b"]}', '{"source":["a\\\\b","\\n"]}'],
    ];

    for (const [name, source, target] of cases) {
      it(`round-trips ${name}`, () => {
        assertRoundTrip(source, target);
      });
    }

    it('round-trips a serialized editor state', () => {
      const state = (source: string[], active: boolean): string => JSON.stringify({
        sources: [{name: 'Code 1', language: 'python', active, source}],
        tests: [{name: 'Test 1', input: '10', output: '23', active: true, clientId: 'user-0'}],
      });

      assertRoundTrip(
        state(['def resoudre(n):', '    total = 0', '    return total'], true),
        state(['def resoudre(n):', '    total = sum(range(n))', '', '    return total'], false),
      );
    });

    it('survives the UTF-8 encoding used to store the patch', () => {
      const source = 'x = "😀"';
      const target = 'x = "😃"';
      const stored = Buffer.from(createPatch(source, target), 'utf8').toString('utf8');

      assert.equal(applyPatch(source, stored), target);
    });

    it('rebuilds every state by walking a chain of reverse patches from the newest one', () => {
      const states = ['', 'def f():', 'def f():\n    pass', 'def f(n):\n    return n * 2', 'def f(n):\n    return n * 2\n\nprint(f(3))'];
      // Each patch rebuilds a state from the state saved after it, as stored in tm_source_codes_patches
      const patches = states.slice(0, -1).map((state, index) => createPatch(states[index + 1], state));

      let current = states[states.length - 1];
      for (let index = patches.length - 1; index >= 0; index--) {
        current = applyPatch(current, patches[index]);
        assert.equal(current, states[index]);
      }
    });

    it('round-trips random edits', () => {
      const random = seededRandom(42);
      // Split by code points so that the emoji is never cut into lone surrogates: fast-diff overflows
      // the stack on them, and createPatch never receives any since JSON.stringify escapes them
      const alphabet = Array.from('abc def\n\t"\\{}[]é😀😃');
      const randomText = (length: number): string => Array.from({length}, () => alphabet[Math.floor(random() * alphabet.length)]).join('');

      let source = randomText(200);
      for (let iteration = 0; iteration < 500; iteration++) {
        const at = Math.floor(random() * (source.length + 1));
        const deleted = Math.floor(random() * 20);
        const target = source.slice(0, at) + randomText(Math.floor(random() * 20)) + source.slice(at + deleted);

        assert.equal(applyPatch(source, createPatch(source, target)), target, `iteration ${iteration}`);
        source = target;
      }
    });
  });
});
