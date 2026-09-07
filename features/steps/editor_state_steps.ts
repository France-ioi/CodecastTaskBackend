import {Then} from '@cucumber/cucumber';
import {expect} from 'chai';
import {ServerInjectResponse} from '@hapi/hapi';
import {applyPatch} from 'diff';
import {EditorStateHistoryOutput} from '../../src/editor_state';

interface EditorStateStepsContext {
  response: ServerInjectResponse,
}

/**
 * Rebuilds the states of a history response the way the client does it: the response holds the
 * serialized state of the newest patch, and the state of each of the older ones is obtained by
 * applying its own reverse patch to the state of the patch after it. The expected states are the
 * deserialized ones, from the newest to the oldest.
 */
Then(/^rebuilding the states of the response should give:$/, function (this: EditorStateStepsContext, expectedJson: string) {
  const history = JSON.parse(this.response.payload) as EditorStateHistoryOutput;

  const states: unknown[] = [];
  let serializedState = history.state;
  for (const [index, patch] of history.patches.entries()) {
    if (null === serializedState) {
      throw new Error(`Cannot rebuild the state of the patch ${patch.patchId}, the chain is broken`);
    }

    if (0 !== index) {
      // The newest patch is the only one whose state comes as it is, the others rebuild theirs. A
      // patch without a reverse patch is the root of the chain: its own state, and everything older
      // than it, cannot be rebuilt
      if (null === patch.patch) {
        break;
      }

      const rebuiltState = applyPatch(serializedState, patch.patch);
      if (false === rebuiltState) {
        throw new Error(`The patch ${patch.patchId} does not apply`);
      }
      serializedState = rebuiltState;
    }

    states.push(JSON.parse(serializedState));
  }

  expect(states).to.deep.equal(JSON.parse(expectedJson));
});
