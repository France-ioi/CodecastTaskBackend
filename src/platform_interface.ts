import got from 'got';
import {
  decodePlatformTaskToken,
  PlatformAnswerTokenPayload,
  PlatformGenericTokenPayload,
  PlatformTaskTokenPayload,
  TokenGenerator,
} from './tokenization';
import appConfig from './config';
import * as Db from './db';
import {Platform, Submission} from './db_models';
import {InvalidInputError, PlatformInteractionError} from './error_handler';

export interface PlatformTaskTokenData {
  payload: PlatformTaskTokenPayload,
  taskId: string,
  platform: Platform,
}

export interface PlatformAnswerTokenData {
  payload: PlatformAnswerTokenPayload,
  taskId: string,
  platform: Platform,
}

export async function extractPlatformTaskTokenData(token: string|null|undefined, platformName: string|null|undefined, taskId: string|null = null): Promise<PlatformTaskTokenData> {
  const platformEntity = await getPlatformByName(platformName);
  let payload: PlatformTaskTokenPayload;
  try {
    payload = await decodePlatformTaskToken<PlatformTaskTokenPayload>(token, platformEntity);
  } catch (e) {
    if (appConfig.testMode.enabled && null !== taskId) {
      payload = getTestTokenParameters(taskId);
    } else {
      throw e;
    }
  }

  if (!payload.idUser || (!payload.idItem && !payload.itemUrl)) {
    throw new InvalidInputError('Missing idUser or idItem in token');
  }

  return {
    payload: payload,
    taskId: await getTaskIdFromTaskTokenPayload(payload),
    platform: platformEntity,
  };
}

export async function extractPlatformAnswerTaskTokenData(token: string|null|undefined, platformName: string|null|undefined, taskId: string|null = null): Promise<PlatformAnswerTokenData> {
  const platformEntity = await getPlatformByName(platformName);
  let payload: PlatformAnswerTokenPayload;
  try {
    payload = await decodePlatformTaskToken<PlatformAnswerTokenPayload>(token, platformEntity);
  } catch (e) {
    if (appConfig.testMode.enabled && null !== taskId) {
      payload = getTestTokenParameters(taskId);
    } else {
      throw e;
    }
  }

  if (!payload.idUser || (!payload.idItem && !payload.itemUrl)) {
    throw new InvalidInputError('Missing idUser or idItem in token');
  }

  return {
    payload: payload,
    taskId: await getTaskIdFromTaskTokenPayload(payload),
    platform: platformEntity,
  };
}

function getIdFromUrl(itemUrl: string): string|null {
  const urlSearchParams = (new URL(itemUrl)).searchParams;
  const params = Object.fromEntries(urlSearchParams.entries());

  return params['taskId'] ? params['taskId'] : null;
}

async function getTaskIdFromTaskTokenPayload(params: PlatformGenericTokenPayload): Promise<string> {
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

function getTestTokenParameters(taskId: string): PlatformTaskTokenPayload {
  return {
    idUser: appConfig.testMode.userId ? appConfig.testMode.userId : null,
    bSubmissionPossible: true,
    itemUrl: appConfig.baseUrl ? appConfig.baseUrl + '?taskId=' + taskId : null,
    bAccessSolutions: appConfig.testMode.accessSolutions,
    nbHintsGiven: appConfig.testMode.nbHintsGiven,
  };
}

export async function askPlatformAnswerToken(taskToken: string, answer: string, platform: Platform): Promise<string> {
  const platformUrl = `${platform.api_url}/answers`;

  const askAnswerTokenRequest = {
    answer,
    task_token: taskToken,
  };

  const gotResponse = await got.post(platformUrl, {
    headers: {
      'content-type': 'application/json',
      // TODO: remove this
      Cookie: 'access_token=3!9e77b78wo8l0n1slexc35xra7ur05x1q!beta.opentezos.com!/api/',
    },
    json: askAnswerTokenRequest,
  }).json<{success: boolean, data?: {answer_token: string}}>();

  if (!gotResponse.success) {
    throw new PlatformInteractionError('Impossible to fetch answer token from platform');
  }

  return gotResponse.data?.answer_token!;
}

export async function getPlatformByName(platformName?: string|null): Promise<Platform> {
  if (!platformName && appConfig.testMode.enabled && appConfig.testMode.platformName) {
    platformName = appConfig.testMode.platformName;
  }

  const platforms = await Db.execute<Platform[]>('SELECT * FROM tm_platforms WHERE name = ?', [platformName]);
  if (!platforms.length) {
    throw new InvalidInputError(`Cannot find platform ${platformName || ''}`);
  }

  return platforms[0];
}

export async function getPlatformById(platformId: string): Promise<Platform> {
  const platforms = await Db.execute<Platform[]>('SELECT * FROM tm_platforms WHERE id = ?', [platformId]);
  if (!platforms.length) {
    throw new InvalidInputError(`Cannot find platform ${platformId || ''}`);
  }

  return platforms[0];
}

export async function sendSubmissionResultToPlatform(submission: Submission): Promise<void> {
  // $scoreToken = generateScoreToken(submission, $idItem, $itemUrl, $idUser, $idSubmission, $score, $tokenGenerator, $idUserAnswer);

  const platform = await getPlatformById(submission.idPlatform);
  const platformUrl = `${platform.api_url}/items/save-grade`;

  const saveGradeRequest = {
    token: '',
    answer_token: '',
    score_token: '',
    score: 50,
  };

  const gotResponse = await got.post(platformUrl, {
    headers: {
      'content-type': 'application/json',
      // TODO: remove this
      Cookie: 'access_token=3!9e77b78wo8l0n1slexc35xra7ur05x1q!beta.opentezos.com!/api/',
    },
    json: saveGradeRequest,
  }).json<{success: boolean}>();

  if (!gotResponse.success) {
    throw new PlatformInteractionError('Impossible to save grade on the platform');
  }
}

export async function generateScoreToken(submission: Submission): Promise<string> {
  const tokenGenerator = new TokenGenerator();
  await tokenGenerator.setKeys(appConfig.platform.ownPrivateKey);

  const params = {
    idUser: submission.idUser,
    idItem: submission.idTask,
    itemUrl: '', // TODO
    idUserAnswer: '',
    sAnswer: '',
    score: 0,
  };

  return await tokenGenerator.jwsSignPayload(params);
}
