import * as Db from './db';
import {Platform, SourceCode} from './models';
import {decodePlatformToken, PlatformTokenParameters} from './tokenization';
import {decode, getRandomId} from './util';
import * as D from 'io-ts/Decoder';
import {pipe} from 'fp-ts/function';
import {InvalidInputError} from './error_handler';

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
    })),
  }))
);
export type SubmissionParameters = D.TypeOf<typeof submissionDataDecoder>;

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

  const ids = await Db.execute<{ID: string}[]>('SELECT ID FROM tm_tasks WHERE sTextId = ?', [idItem]);
  if (!ids.length) {
    throw new InvalidInputError(`Cannot find task ${idItem || ''}`);
  }

  return ids[0].ID;
}

export async function createSubmission(submissionDataPayload: unknown): Promise<string> {
  const submissionData: SubmissionParameters = decode(submissionDataDecoder)(submissionDataPayload);

  if (!process.env.TEST_MODE && (!submissionData.token || !submissionData.platform)) {
    throw new InvalidInputError('Missing token or platform POST variable');
  }

  const params = await getPlatformTokenParams(submissionData.taskId, submissionData.token, submissionData.platform);
  const mode = submissionData.userTests && submissionData.userTests.length ? 'UserTest' : 'Submitted';

  // save source code (with bSubmission = 1)
  const idNewSourceCode = getRandomId();
  const idSubmission = getRandomId();
  const sourceCodeParams = JSON.stringify({
    sLangProg: submissionData.answer.language,
  });

  await Db.execute("insert into tm_source_codes (ID, idUser, idPlatform, idTask, sDate, sParams, sName, sSource, bSubmission) values(:idNewSC, :idUser, :idPlatform, :idTask, NOW(), :sParams, :idSubmission, :sSource, '1');", {
    idNewSC: idNewSourceCode,
    idUser: params.idUser,
    idPlatform: params.idPlatform,
    idTask: params.idTaskLocal,
    sParams: sourceCodeParams,
    idSubmission,
    sSource: submissionData.answer.sourceCode
  });

  await Db.execute('insert into tm_submissions (ID, idUser, idPlatform, idTask, sDate, idSourceCode, sMode) values(:idSubmission, :idUser, :idPlatform, :idTask, NOW(), :idSourceCode, :sMode);', {
    idSubmission,
    idUser: params.idUser,
    idPlatform: params.idPlatform,
    idTask: params.idTaskLocal,
    idSourceCode: idNewSourceCode,
    sMode: mode,
  });

  if ('UserTest' === mode && submissionData.userTests) {
    for (const [index, test] of submissionData.userTests.entries()) {
      await Db.execute("insert into tm_tasks_tests (idUser, idPlatform, idTask, sGroupType, sInput, sOutput, sName, iRank, idSubmission) values(:idUser, :idPlatform, :idTask, 'Submission', :sInput, :sOutput, :sName, :iRank, :idSubmission);", {
        idUser: params.idUser,
        idPlatform: params.idPlatform,
        idTask: params.idTaskLocal,
        sInput: test.input,
        sOutput: test.output,
        name: test.name,
        iRank: index,
        idSubmission,
      });
    }
  }

  return idSubmission;
}

export async function findSourceCodeById(sourceCodeId: string): Promise<SourceCode|null> {
  const sourceCodes = await Db.execute<SourceCode[]>('SELECT * FROM tm_source_codes WHERE ID = ?', [sourceCodeId]);

  return sourceCodes.length ? {...sourceCodes[0]} as SourceCode : null;
}
