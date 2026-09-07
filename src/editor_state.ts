import * as Db from './db';
import {SourceCodePatch} from './db_models';
import * as D from 'io-ts/Decoder';
import {pipe} from 'fp-ts/function';
import {PoolConnection} from 'mysql2/promise';
import {AccessDeniedError, InvalidInputError} from './error_handler';
import {extractPlatformTaskTokenData, PlatformTaskTokenData} from './platform_interface';
import appConfig from './config';
import {getRandomId} from './util';
import {createPatch} from 'diff';
import {compress, decompress} from './compression';

const editorSourceDecoder = pipe(
  D.struct({
    name: D.string,
    source: D.string,
    language: D.string,
  }),
  D.intersect(D.partial({
    active: D.boolean,
  })),
);
export type EditorSource = D.TypeOf<typeof editorSourceDecoder>;

const editorTestDecoder = pipe(
  D.struct({
    name: D.string,
    input: D.string,
    output: D.string,
  }),
  D.intersect(D.partial({
    active: D.boolean,
    clientId: D.nullable(D.string),
  })),
);
export type EditorTest = D.TypeOf<typeof editorTestDecoder>;

export const editorStateDecoder = pipe(
  D.struct({
    sources: D.array(editorSourceDecoder),
  }),
  D.intersect(D.partial({
    token: D.nullable(D.string),
    platform: D.nullable(D.string),
    tests: D.nullable(D.array(editorTestDecoder)),
  })),
);
export type EditorStateParameters = D.TypeOf<typeof editorStateDecoder>;

export const editorStateQueryDecoder = pipe(
  D.partial({
    token: D.nullable(D.string),
    platform: D.nullable(D.string),
  })
);
export type EditorStateQueryParameters = D.TypeOf<typeof editorStateQueryDecoder>;

// The editor state as it is exchanged with the client: the source of a tab is a single string
export interface EditorSourceNormalized {
  name: string,
  source: string,
  language: string,
  active: boolean,
}

export interface EditorTestNormalized {
  name: string,
  input: string,
  output: string,
  active: boolean,
  clientId: string|null,
}

export interface EditorStateNormalized {
  sources: EditorSourceNormalized[],
  // A null tests list means the task has no user tests
  tests: EditorTestNormalized[]|null,
}

export interface EditorStatePatchOutput {
  patchId: number,
  date: string,
  // The reverse patch that rebuilds the state of this patch from the state of the patch after it.
  // Null on the newest patch, whose state is sent in full, and on the root of a chain, whose own
  // state can no longer be rebuilt
  patch: string|null,
}

export interface EditorStateHistoryOutput {
  // The serialized state of the newest patch, as the server stored it, as the starting point of the
  // chain. It is not rebuilt from the normalized state so that the client never has to produce the
  // exact same bytes as the server for the patches to apply
  state: string|null,
  patches: EditorStatePatchOutput[],
}

// The editor state as it is stored and diffed: the source of a tab is the array of its lines. The
// patches are line based, so with a source kept as a single string (its newlines escaped inside the
// JSON string) the whole program sits on one line and changing one character of it produces a patch
// containing the whole program.
interface EditorSourceStored {
  name: string,
  language: string,
  active: boolean,
  source: string[],
}

interface EditorTestStored {
  name: string,
  input: string,
  output: string,
  active: boolean,
  clientId: string|null,
}

interface EditorStateStored {
  sources: EditorSourceStored[],
  tests: EditorTestStored[]|null,
}

// The state is serialized indented so that each source line, and each field of a tab or of a test,
// ends up on its own line and can be diffed on its own
const stateSerializationIndentation = 1;

// Name of the diffed file in the header of the unified diffs, only there to keep them well formed
const patchFileName = 'state';

// A save can be retried this many times before giving up, see saveEditorState
const maxSaveAttempts = 3;

const ownerCriteria = 'idUser = :idUser AND idTask = :idTask AND idPlatform = :idPlatform';

/**
 * Saves the current state of the editor tabs (source codes, and user tests when the task has any)
 * of a user for a task, as a new patch at the end of the chain of patches of this user for this
 * task.
 */
export async function saveEditorState(taskId: string, editorStateData: EditorStateParameters): Promise<void> {
  const taskTokenData = await getTaskTokenData(taskId, editorStateData.token, editorStateData.platform);
  checkTaskTokenAllowsSaving(taskTokenData);

  for (let attempt = 1; ; attempt++) {
    try {
      await Db.transactional(async connection => {
        await insertEditorStatePatch(connection, taskTokenData, editorStateData);
      });

      return;
    } catch (error) {
      // Two saves of the same user on the same task racing compute the same idPatch, and the unique
      // key makes the second insert fail. Read the chain again and retry from the row the other
      // request inserted. The retry needs its own transaction: in REPEATABLE READ, reading the
      // table again inside the current one would return the same snapshot and never see that row.
      if (attempt >= maxSaveAttempts || !isDuplicateEntryError(error)) {
        throw error;
      }
    }
  }
}

/**
 * Returns the last saved state of the editor of a user for a task, or null when this user has never
 * saved anything on it.
 */
export async function getEditorState(taskTokenData: PlatformTaskTokenData): Promise<EditorStateNormalized|null> {
  const lastPatch = await findLastPatch(taskTokenData);
  if (null === lastPatch || null === lastPatch.fullState) {
    return null;
  }

  return denormalizeState(parseState(decompress(lastPatch.fullState)));
}

/**
 * Returns the whole chain of patches of a user for a task, newest first, with the serialized state
 * of the newest one as the starting point. The client rebuilds the states from the newest to the
 * oldest by applying the patch of each patch to the state of the patch before it in the list.
 */
export async function getEditorStateHistory(taskId: string, queryParameters: EditorStateQueryParameters): Promise<EditorStateHistoryOutput> {
  // Reading the history is allowed on a read-only task, so unlike a save it is not checked against
  // bSubmissionPossible / bAllowGrading
  const taskTokenData = await getTaskTokenData(taskId, queryParameters.token, queryParameters.platform);

  const patches = await Db.execute<SourceCodePatch[]>(
    `SELECT * FROM tm_source_codes_patches WHERE ${ownerCriteria} ORDER BY idPatch DESC`,
    getOwnerCriteriaParameters(taskTokenData),
  );

  // Only the newest patch still holds a state, the older ones were cleared by the saves that
  // followed them
  const headState = patches.length ? patches[0].fullState : null;

  return {
    state: null !== headState ? decompress(headState) : null,
    patches: patches.map(patch => ({
      patchId: patch.idPatch,
      date: patch.sDate,
      patch: null !== patch.patch ? decompress(patch.patch) : null,
    })),
  };
}

async function getTaskTokenData(taskId: string, token: string|null|undefined, platform: string|null|undefined): Promise<PlatformTaskTokenData> {
  if (!appConfig.testMode.enabled && (!token || !platform)) {
    throw new InvalidInputError('Missing token or platform parameters');
  }

  // The state belongs to the task of the token, the task id from the URL is only used as a fallback
  // for the test mode, in which there is no token to extract it from
  const taskTokenData = await extractPlatformTaskTokenData(token, platform, taskId);
  if (taskId !== taskTokenData.taskId) {
    throw new AccessDeniedError(`Task id mismatch between the requested task and provided task id from the token: ${taskTokenData.taskId}`);
  }

  return taskTokenData;
}

function checkTaskTokenAllowsSaving(taskTokenData: PlatformTaskTokenData): void {
  if (appConfig.testMode.enabled) {
    return;
  }

  if (false === taskTokenData.payload.bSubmissionPossible || false === taskTokenData.payload.bAllowGrading) {
    throw new InvalidInputError('Token indicates read-only task');
  }
}

function getOwnerCriteriaParameters(taskTokenData: PlatformTaskTokenData): Record<string, unknown> {
  return {
    idUser: taskTokenData.payload.idUser,
    idTask: taskTokenData.taskId,
    idPlatform: taskTokenData.platform.ID,
  };
}

async function findLastPatch(taskTokenData: PlatformTaskTokenData, connection?: PoolConnection): Promise<SourceCodePatch|null> {
  const query = `SELECT * FROM tm_source_codes_patches WHERE ${ownerCriteria} ORDER BY idPatch DESC LIMIT 1`;
  const parameters = getOwnerCriteriaParameters(taskTokenData);

  const patches = undefined !== connection
    ? await Db.executeInConnection<SourceCodePatch[]>(connection, query, parameters)
    : await Db.execute<SourceCodePatch[]>(query, parameters);

  return patches.length ? patches[0] : null;
}

async function insertEditorStatePatch(connection: PoolConnection, taskTokenData: PlatformTaskTokenData, editorStateData: EditorStateParameters): Promise<void> {
  const lastPatch = await findLastPatch(taskTokenData, connection);
  const previousSerializedState = lastPatch?.fullState ? decompress(lastPatch.fullState) : null;
  const previousState = null !== previousSerializedState ? parseState(previousSerializedState) : null;

  const state = normalizeState(editorStateData, previousState);
  const serializedState = serializeState(state);

  // The client already avoids sending a state it has just sent, but it does so per session: another
  // tab, a page reload or another device would send it again. Which tab and which test are active
  // is not worth a patch of its own either.
  if (null !== previousState && serializeStateWithoutSelection(state) === serializeStateWithoutSelection(previousState)) {
    return;
  }

  // The newest row is the only one to keep a state in full, and it needs no patch since nothing
  // newer points at it
  await Db.executeInConnection(connection, `INSERT INTO tm_source_codes_patches (ID, idUser, idTask, idPlatform, idPatch, sDate, patch, fullState)
    VALUES (:id, :idUser, :idTask, :idPlatform, :idPatch, NOW(), NULL, :fullState)`, {
    ...getOwnerCriteriaParameters(taskTokenData),
    id: getRandomId(),
    idPatch: (lastPatch?.idPatch ?? 0) + 1,
    fullState: compress(serializedState),
  });

  if (null !== lastPatch && null !== previousSerializedState) {
    // The row that just stopped being the newest one gives up its state and receives, in exchange,
    // the reverse patch that rebuilds it from the state being saved. Every row then holds what is
    // needed to rebuild its own state, and the states are walked backwards from the newest one.
    // Updating by primary key: only that row could still hold a state and lack its patch, the older
    // ones were settled by the saves that followed them, so no range update is needed
    const patch = createPatch(patchFileName, serializedState, previousSerializedState);

    await Db.executeInConnection(connection, 'UPDATE tm_source_codes_patches SET patch = :patch, fullState = NULL WHERE ID = :id', {
      id: lastPatch.ID,
      patch: compress(patch),
    });
  }
}

function isDuplicateEntryError(error: unknown): boolean {
  const cause: unknown = error instanceof Db.DatabaseError ? error.error : error;

  return 'ER_DUP_ENTRY' === (cause as {code?: string}|null)?.code;
}

function normalizeState(editorStateData: EditorStateParameters, previousState: EditorStateStored|null): EditorStateStored {
  return {
    sources: editorStateData.sources.map(source => ({
      name: source.name,
      language: source.language,
      active: !!source.active,
      source: source.source.split('\n'),
    })),
    // A null (or missing) tests list means the task has no user tests, the ones of the previous
    // state must then be left as they are
    tests: undefined === editorStateData.tests || null === editorStateData.tests
      ? previousState?.tests ?? null
      : editorStateData.tests.map(test => ({
        name: test.name,
        input: test.input,
        output: test.output,
        active: !!test.active,
        clientId: test.clientId ?? null,
      })),
  };
}

function denormalizeState(state: EditorStateStored): EditorStateNormalized {
  return {
    sources: state.sources.map(source => ({
      name: source.name,
      source: source.source.join('\n'),
      language: source.language,
      active: source.active,
    })),
    tests: state.tests?.map(test => ({
      name: test.name,
      input: test.input,
      output: test.output,
      active: test.active,
      clientId: test.clientId,
    })) ?? null,
  };
}

function serializeState(state: EditorStateStored): string {
  return JSON.stringify(state, null, stateSerializationIndentation);
}

function parseState(serializedState: string): EditorStateStored {
  return JSON.parse(serializedState) as EditorStateStored;
}

// Serialization of a state without which tab and which test are active, to compare two states while
// ignoring what the user has merely selected
function serializeStateWithoutSelection(state: EditorStateStored): string {
  return JSON.stringify({
    sources: state.sources.map(source => ({...source, active: false})),
    tests: state.tests?.map(test => ({...test, active: false})) ?? null,
  });
}
