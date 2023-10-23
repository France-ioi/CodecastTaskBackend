import * as Db from './db';
import {
  Platform,
  SourceCode,
  Submission,
  SubmissionSubtask,
  SubmissionTest, TaskTest,
} from './db_models';
import {decodePlatformToken, PlatformTokenParameters} from './tokenization';
import {decode, getRandomId} from './util';
import * as D from 'io-ts/Decoder';
import {pipe} from 'fp-ts/function';
import {InvalidInputError} from './error_handler';
import {sendSubmissionToTaskGrader} from './grader_interface';
import {findTaskById, normalizeTaskTest} from './tasks';
import {ProgramExecutionResultMetadata} from './grader_webhook';

export const submissionDataDecoder = pipe(
  D.struct({
    taskId: D.string,
    taskParams: D.struct({
      returnUrl: D.string,
    }),
    answer: D.struct({
      sourceCode: D.string,
      language: D.string,
    }),
    sLocale: D.string,
  }),
  D.intersect(D.partial({
    token: D.nullable(D.string),
    platform: D.nullable(D.string),
    answerToken: D.nullable(D.string),
    userTests: D.array(D.struct({
      name: D.string,
      input: D.string,
      output: D.string,
      clientId: D.nullable(D.string),
    })),
  }))
);
export type SubmissionParameters = D.TypeOf<typeof submissionDataDecoder>;

export enum SubmissionMode {
  Submitted = 'Submitted',
  LimitedTime = 'LimitedTime',
  Contest = 'Contest',
  UserTest = 'UserTest',
}

export interface SubmissionNormalized {
  id: string,
  success: boolean,
  totalTestsCount: number,
  passedTestsCount: number,
  score: number,
  compilationError: boolean,
  compilationMessage: string|null,
  errorMessage: string|null,
  metadata: ProgramExecutionResultMetadata|null,
  evaluated: boolean,
  confirmed: boolean,
  manualCorrection: boolean,
  manualScoreDiffComment: string|null,
  mode: SubmissionMode,
}

export interface SubmissionSubtaskNormalized {
  id: string,
  success: boolean,
  score: number,
  subtaskId: string,
}

export interface SubmissionTestNormalized {
  id: string,
  testId: string,
  score: number,
  timeMs: number,
  memoryKb: number,
  errorCode: number,
  output: string|null,
  expectedOutput: string|null,
  errorMessage: string|null,
  metadata: ProgramExecutionResultMetadata|null,
  log: string|null,
  noFeedback: boolean,
  files: string[]|null,
  submissionSubtaskId: string|null,
}

export interface SourceCodeParams {
  sLangProg: string,
}

export interface SourceCodeNormalized {
  id: string,
  params: SourceCodeParams|null,
  name: string,
  source: string,
  editable: boolean,
  active: boolean,
  rank: number,
}

export interface SubmissionOutput extends SubmissionNormalized {
  sourceCode?: SourceCodeNormalized|null,
  subTasks?: SubmissionSubtaskNormalized[],
  tests?: SubmissionTestNormalized[],
}

export async function getPlatformTokenParams(taskId: string, token?: string|null, platform?: string|null): Promise<PlatformTokenParameters> {
  if (!platform && process.env.TEST_MODE && process.env.TEST_MODE_PLATFORM_NAME) {
    platform = process.env.TEST_MODE_PLATFORM_NAME;
  }

  const platforms = await Db.execute<Platform[]>('SELECT ID, public_key FROM tm_platforms WHERE name = ?', [platform]);
  if (!platforms.length) {
    throw new InvalidInputError(`Cannot find platform ${platform || ''}`);
  }

  const platformEntity = platforms[0];
  const platformKey = platformEntity.public_key;

  const params = decodePlatformToken(token, platformKey, platform as string, taskId, platformEntity);

  if (!params.idUser || (!params.idItem && !params.itemUrl)) {
    // console.error('Missing idUser or idItem in token', params);
    throw new InvalidInputError('Missing idUser or idItem in token');
  }

  params.idPlatform = platformEntity.ID;
  params.idTaskLocal = await getLocalIdTask(params);

  return params;
}

function getIdFromUrl(itemUrl: string): string|null {
  const urlSearchParams = (new URL(itemUrl)).searchParams;
  const params = Object.fromEntries(urlSearchParams.entries());

  return params['taskId'] ? params['taskId'] : null;
}

async function getLocalIdTask(params: PlatformTokenParameters): Promise<string> {
  const idItem = params.idItem || null;
  const itemUrl = params.itemUrl || null;
  if (itemUrl) {
    const id = getIdFromUrl(itemUrl);
    if (!id) {
      throw new InvalidInputError('Cannot find ID in url ' + itemUrl);
    }

    return id;
  }

  const id = await Db.querySingleScalarResult<string>('SELECT ID FROM tm_tasks WHERE sTextId = ?', [idItem]);
  if (!id) {
    throw new InvalidInputError(`Cannot find task ${idItem || ''}`);
  }

  return id;
}

export async function createSubmission(submissionDataPayload: unknown): Promise<string> {
  const submissionData: SubmissionParameters = decode(submissionDataDecoder)(submissionDataPayload);

  if (!process.env.TEST_MODE && (!submissionData.token || !submissionData.platform)) {
    throw new InvalidInputError('Missing token or platform POST variable');
  }

  const params = await getPlatformTokenParams(submissionData.taskId, submissionData.token, submissionData.platform);
  const task = await findTaskById(params.idTaskLocal);
  if (null === task) {
    throw new InvalidInputError(`Invalid task id: ${params.idTaskLocal}`);
  }

  const mode = submissionData.userTests && submissionData.userTests.length ? SubmissionMode.UserTest : SubmissionMode.Submitted;

  // save source code (with bSubmission = 1)
  const idNewSourceCode = getRandomId();
  const idSubmission = getRandomId();
  const sourceCodeParams = JSON.stringify({
    sLangProg: submissionData.answer.language,
  });

  await Db.transactional(async connection => {
    await Db.executeInConnection(connection, "insert into tm_source_codes (ID, idUser, idPlatform, idTask, sDate, sParams, sName, sSource, bEditable, bSubmission) values(:idNewSC, :idUser, :idPlatform, :idTask, NOW(), :sParams, :idSubmission, :sSource, '0', '1');", {
      idNewSC: idNewSourceCode,
      idUser: params.idUser,
      idPlatform: params.idPlatform,
      idTask: params.idTaskLocal,
      sParams: sourceCodeParams,
      idSubmission,
      sSource: submissionData.answer.sourceCode
    });

    await Db.executeInConnection(connection, 'insert into tm_submissions (ID, idUser, idPlatform, idTask, sDate, idSourceCode, sMode) values(:idSubmission, :idUser, :idPlatform, :idTask, NOW(), :idSourceCode, :sMode);', {
      idSubmission,
      idUser: params.idUser,
      idPlatform: params.idPlatform,
      idTask: params.idTaskLocal,
      idSourceCode: idNewSourceCode,
      sMode: mode,
    });

    const testPrefixId = getRandomId().slice(0, -2);
    if ('UserTest' === mode && submissionData.userTests && submissionData.userTests.length) {
      const valuesToInsert = submissionData.userTests.map((test, index) => ([
        testPrefixId + '' + String(index),
        params.idUser,
        params.idPlatform,
        params.idTaskLocal,
        'User',
        test.input,
        test.output,
        test.name,
        test.clientId,
        index,
        idSubmission,
      ]));

      await Db.executeInConnection(connection, 'insert into tm_tasks_tests (ID, idUser, idPlatform, idTask, sGroupType, sInput, sOutput, sName, sClientId, iRank, idSubmission) values ?', [valuesToInsert]);
    }
  });

  await sendSubmissionToTaskGrader(idSubmission, submissionData);

  return idSubmission;
}

export async function findSourceCodeById(sourceCodeId: string): Promise<SourceCode|null> {
  return await Db.querySingleResult<SourceCode>('SELECT * FROM tm_source_codes WHERE ID = ?', [sourceCodeId]);
}

export async function findSubmissionById(submissionId: string): Promise<Submission|null> {
  return await Db.querySingleResult<Submission>('SELECT * FROM tm_submissions WHERE ID = ?', [submissionId]);
}

function normalizeSubmission(submission: Submission): SubmissionNormalized {
  return {
    id: submission.ID,
    success: !!submission.bSuccess,
    totalTestsCount: submission.nbTestsTotal,
    passedTestsCount: submission.nbTestsPassed,
    score: submission.iScore,
    compilationError: !!submission.bCompilError,
    compilationMessage: submission.sCompilMsg,
    errorMessage: submission.sErrorMsg,
    metadata: submission.sMetadata ? JSON.parse(submission.sMetadata) as ProgramExecutionResultMetadata : null,
    evaluated: !!submission.bEvaluated,
    confirmed: !!submission.bConfirmed,
    manualCorrection: !!submission.bManualCorrection,
    manualScoreDiffComment: submission.sManualScoreDiffComment,
    mode: submission.sMode,
  };
}

function normalizeSubmissionSubtask(submissionSubtask: SubmissionSubtask): SubmissionSubtaskNormalized {
  return {
    id: submissionSubtask.ID,
    success: !!submissionSubtask.bSuccess,
    score: submissionSubtask.iScore,
    subtaskId: submissionSubtask.idSubtask,
  };
}

function normalizeSubmissionTest(submissionTest: SubmissionTest, submissionTests: TaskTest[]): SubmissionTestNormalized {
  const originalTest = submissionTests.find(test => submissionTest.idTest === test.ID);

  return {
    id: submissionTest.ID,
    testId: submissionTest.idTest,
    ...(originalTest ? {test: normalizeTaskTest(originalTest)} : {}),
    score: submissionTest.iScore,
    timeMs: submissionTest.iTimeMs,
    memoryKb: submissionTest.iMemoryKb,
    errorCode: submissionTest.iErrorCode,
    metadata: submissionTest.sMetadata ? JSON.parse(submissionTest.sMetadata) as ProgramExecutionResultMetadata : null,
    output: submissionTest.sOutput,
    expectedOutput: submissionTest.sExpectedOutput,
    errorMessage: submissionTest.sErrorMsg,
    log: submissionTest.sLog,
    noFeedback: !!submissionTest.bNoFeedback,
    files: null !== submissionTest.jFiles ? JSON.parse(submissionTest.jFiles) as string[] : null,
    submissionSubtaskId: submissionTest.idSubmissionSubtask,
  };
}

function normalizeSourceCode(sourceCode: SourceCode): SourceCodeNormalized {
  return {
    id: sourceCode.ID,
    params: sourceCode.sParams ? JSON.parse(sourceCode.sParams) as SourceCodeParams : null,
    name: sourceCode.sName,
    source: sourceCode.sSource,
    editable: !!sourceCode.bEditable,
    active: !!sourceCode.bActive,
    rank: sourceCode.iRank,
  };
}

export async function getSubmission(submissionId: string): Promise<SubmissionOutput|null> {
  const submission = await findSubmissionById(submissionId);
  if (null === submission) {
    return null;
  }

  const sourceCode = await findSourceCodeById(submission.idSourceCode);

  if (!submission.bEvaluated) {
    return {
      ...normalizeSubmission(submission),
      sourceCode: null !== sourceCode ? normalizeSourceCode(sourceCode) : null,
    };
  }

  const submissionSubtasks = await Db.execute<SubmissionSubtask[]>('SELECT * FROM tm_submissions_subtasks WHERE idSubmission = ?', [submissionId]);
  const submissionTestResults = await Db.execute<SubmissionTest[]>('SELECT * FROM tm_submissions_tests WHERE idSubmission = ?', [submissionId]);
  const submissionTests = await Db.execute<TaskTest[]>('SELECT * FROM tm_tasks_tests WHERE idSubmission = ? AND sGroupType = "User"', [submissionId]);

  return {
    ...normalizeSubmission(submission),
    sourceCode: null !== sourceCode ? normalizeSourceCode(sourceCode) : null,
    subTasks: submissionSubtasks.map(normalizeSubmissionSubtask),
    tests: submissionTestResults.map(test => normalizeSubmissionTest(test, submissionTests)),
  };
}
