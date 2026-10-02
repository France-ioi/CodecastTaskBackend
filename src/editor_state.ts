import * as Db from './db';
import {SourceCodePatch} from './db_models';
import * as D from 'io-ts/Decoder';
import {pipe} from 'fp-ts/function';
import {PoolConnection} from 'mysql2/promise';
import {AccessDeniedError, InvalidInputError} from './error_handler';
import {extractPlatformTaskTokenData, PlatformTaskTokenData} from './platform_interface';
import appConfig from './config';
import {getRandomId} from './util';
import {createPatch} from './patch';
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
    tests: D.array(editorTestDecoder),
  }),
  D.intersect(D.partial({
    token: D.nullable(D.string),
    platform: D.nullable(D.string),
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

const defaultHistoryLimit = 100;
const maxHistoryLimit = 1000;

// The numbers come as strings since they come from the query string
const positiveIntegerFromString = pipe(
  D.string,
  D.parse(value => (/^\d+$/.test(value) ? D.success(Number(value)) : D.failure(value, 'a positive integer'))),
);

export const editorStateHistoryQueryDecoder = pipe(
  editorStateQueryDecoder,
  D.intersect(D.partial({
    limit: pipe(
      positiveIntegerFromString,
      D.refine((limit): limit is number => limit >= 1 && limit <= maxHistoryLimit, `an integer between 1 and ${maxHistoryLimit}`),
    ),
    earlierThanId: positiveIntegerFromString,
  })),
);
export type EditorStateHistoryQueryParameters = D.TypeOf<typeof editorStateHistoryQueryDecoder>;

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
  // The idPatch of the save: it goes up by one at each save of the attempt
  id: number,
  date: string,
  // The user who made this save, several users share a chain in team solving
  idUser: string,
  // The reverse patch that rebuilds the state of this save from the state of the save after it.
  // Null on the newest save, whose state is sent in full
  patch: string|null,
}

export interface EditorStateHistoryOutput {
  state: string|null,
  // Newest first
  patches: EditorStatePatchOutput[],
}

// The editor state as it is stored and diffed
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

// A save can be retried this many times before giving up, see saveEditorState
const maxSaveAttempts = 5;
// The insert of a patch is retried with a new ID this many times before giving up
const maxIdAttempts = 2;

const ownerCriteria = 'idTask = :idTask AND idPlatform = :idPlatform AND idAttempt = :idAttempt';

/**
 * Saves the current state of the editor tabs (source codes, and user tests when the task has any)
 * of an attempt of a task, as a new patch at the end of the chain of patches of this attempt
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
      if (attempt >= maxSaveAttempts || !isRetryableSaveError(error)) {
        throw error;
      }
    }
  }
}

/**
 * Returns the last saved state of the editor of the attempt of the token, or null when nothing has
 * been saved on this attempt yet.
 */
export async function getEditorState(taskTokenData: PlatformTaskTokenData): Promise<EditorStateNormalized|null> {
  const lastPatch = await findLastPatch(taskTokenData);
  if (null === lastPatch || null === lastPatch.fullState) {
    return null;
  }

  return denormalizeState(parseState(decompress(lastPatch.fullState)));
}

/**
 * Returns a page of the chain of patches of the attempt of the token, newest first, with the
 * serialized state of the newest save when the page starts with it. The server doesn't rebuild any
 * state: the client walks the chain back from the newest state, fetching the next pages with
 * earlierThanId as it needs them, and keeps what it fetched.
 */
export async function getEditorStateHistory(taskId: string, queryParameters: EditorStateHistoryQueryParameters): Promise<EditorStateHistoryOutput> {
  // Reading the history is allowed on a read-only task, so unlike a save it is not checked against
  // bSubmissionPossible / bAllowGrading
  const taskTokenData = await getTaskTokenData(taskId, queryParameters.token, queryParameters.platform);

  const limit = queryParameters.limit ?? defaultHistoryLimit;
  const earlierThanId = queryParameters.earlierThanId ?? null;

  const patches = await Db.execute<Pick<SourceCodePatch, 'idPatch' | 'idUser' | 'sDate' | 'patch' | 'fullState'>[]>(
    `SELECT idPatch, idUser, sDate, patch, fullState FROM tm_source_codes_patches
      WHERE ${ownerCriteria}${null !== earlierThanId ? ' AND idPatch <= :earlierThanId' : ''} ORDER BY idPatch DESC LIMIT :limit`,
    {...getOwnerCriteriaParameters(taskTokenData), earlierThanId, limit},
  );

  // Only the newest patch still holds a state, the older ones were cleared by the saves
  // that followed them
  const headState = patches.length ? patches[0].fullState : null;

  return {
    state: null !== headState ? decompress(headState) : null,
    patches: patches.map(patch => ({
      id: patch.idPatch,
      date: formatHistoryDate(patch.sDate),
      idUser: String(patch.idUser),
      patch: null !== patch.patch ? decompress(patch.patch) : null,
    })),
  };
}

// RFC 3339 precise to the second
function formatHistoryDate(date: string|Date): string {
  return new Date(date).toISOString().replace(/\.\d{3}Z$/, 'Z');
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
    idTask: taskTokenData.taskId,
    idPlatform: taskTokenData.platform.ID,
    idAttempt: getHistoryAttemptId(taskTokenData),
  };
}

/**
 * The idAttempt of the token. The platforms that don't handle attempts (and the
 * test mode) send none: the user then has a single attempt, identified by a value that can't be
 * mistaken for an idAttempt of a platform
 */
function getHistoryAttemptId(taskTokenData: PlatformTaskTokenData): string {
  const idAttempt = taskTokenData.payload.idAttempt;
  if (undefined !== idAttempt && null !== idAttempt && '' !== String(idAttempt)) {
    return String(idAttempt);
  }

  return `user:${String(taskTokenData.payload.idUser)}`;
}

async function findLastPatch(taskTokenData: PlatformTaskTokenData): Promise<Pick<SourceCodePatch, 'fullState'>|null> {
  const query = `SELECT fullState FROM tm_source_codes_patches WHERE ${ownerCriteria} ORDER BY idPatch DESC LIMIT 1`;
  const parameters = getOwnerCriteriaParameters(taskTokenData);
  const patches = await Db.execute<Pick<SourceCodePatch, 'fullState'>[]>(query, parameters);

  return patches.length ? patches[0] : null;
}

async function findLastPatchForInsert(taskTokenData: PlatformTaskTokenData, connection: PoolConnection): Promise<Pick<SourceCodePatch, 'ID' | 'idPatch' | 'fullState'>|null> {
  const query = `SELECT ID, idPatch, fullState FROM tm_source_codes_patches WHERE ${ownerCriteria} ORDER BY idPatch DESC LIMIT 1 FOR UPDATE`;
  const parameters = getOwnerCriteriaParameters(taskTokenData);
  const patches = await Db.executeInConnection<Pick<SourceCodePatch, 'ID' | 'idPatch' | 'fullState'>[]>(connection, query, parameters);

  return patches.length ? patches[0] : null;
}

async function insertEditorStatePatch(connection: PoolConnection, taskTokenData: PlatformTaskTokenData, editorStateData: EditorStateParameters): Promise<void> {
  const lastPatch = await findLastPatchForInsert(taskTokenData, connection);
  const previousSerializedState = lastPatch?.fullState ? decompress(lastPatch.fullState) : null;

  const state = normalizeState(editorStateData);
  const serializedState = serializeState(state);

  if (null !== previousSerializedState && serializedState === previousSerializedState) {
    return;
  }

  // The newest row is the only one to keep a state in full, and it needs no patch since nothing
  // newer points at it
  const insertParameters = {
    ...getOwnerCriteriaParameters(taskTokenData),
    idUser: taskTokenData.payload.idUser,
    idPatch: (lastPatch?.idPatch ?? 0) + 1,
    fullState: compress(serializedState),
  };
  for (let idAttempt = 1; ; idAttempt++) {
    try {
      await Db.executeInConnection(connection, `INSERT INTO tm_source_codes_patches (ID, idAttempt, idUser, idTask, idPlatform, idPatch, sDate, patch, fullState)
        VALUES (:id, :idAttempt, :idUser, :idTask, :idPlatform, :idPatch, NOW(), NULL, :fullState)`, {
        ...insertParameters,
        id: getRandomId(),
      });
      break;
    } catch (error) {
      // The random ID collided with the one of an existing row: draw another one
      if (idAttempt >= maxIdAttempts || !isDuplicateEntryError(error, 'PRIMARY')) {
        throw error;
      }
    }
  }

  if (null !== lastPatch && null !== previousSerializedState) {
    // The row that just stopped being the newest one gives up its state and receives, in exchange,
    // the reverse patch that rebuilds it from the state being saved. Every row then holds what is
    // needed to rebuild its own state, and the states are walked backwards from the newest one.
    // Updating by primary key: only that row could still hold a state and lack its patch, the older
    // ones were settled by the saves that followed them, so no range update is needed
    const patch = createPatch(serializedState, previousSerializedState);

    await Db.executeInConnection(connection, 'UPDATE tm_source_codes_patches SET patch = :patch, fullState = NULL WHERE ID = :id', {
      id: lastPatch.ID,
      patch: compress(patch),
    });
  }
}

function isRetryableSaveError(error: unknown): boolean {
  const code = getDatabaseErrorCause(error)?.code;

  return 'ER_LOCK_DEADLOCK' === code
    || 'ER_LOCK_WAIT_TIMEOUT' === code
    || isDuplicateEntryError(error, 'TaskPlatformAttemptPatch');
}

function isDuplicateEntryError(error: unknown, key: string): boolean {
  const cause = getDatabaseErrorCause(error);

  return 'ER_DUP_ENTRY' === cause?.code
    && new RegExp(`for key '(tm_source_codes_patches\\.)?${key}'$`).test(cause.sqlMessage ?? '');
}

function getDatabaseErrorCause(error: unknown): {code?: string, sqlMessage?: string}|null {
  return (error instanceof Db.DatabaseError ? error.error : error) as {code?: string, sqlMessage?: string}|null;
}

function normalizeState(editorStateData: EditorStateParameters): EditorStateStored {
  return {
    sources: editorStateData.sources.map(source => ({
      name: source.name,
      language: source.language,
      active: !!source.active,
      source: source.source.split('\n'),
    })),
    tests: editorStateData.tests.map(test => ({
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
  return JSON.stringify(state);
}

function parseState(serializedState: string): EditorStateStored {
  return JSON.parse(serializedState) as EditorStateStored;
}
