import {PlatformTokenParameters, TokenGenerator} from './tokenization';
import {findSourceCodeById, getPlatformTokenParams, SubmissionParameters} from './submissions';
import * as Db from './db';
import {findTaskById} from './tasks';
import {Submission, TaskLimit, TaskLimitModel, TaskTest} from './db_models';
import {InvalidInputError} from './error_handler';
import got from 'got';
import log from 'loglevel';
import {getRandomId} from './util';
import appConfig from './config';

function baseLangToJSONLang(baseLang: string): string {
  baseLang = baseLang.toLocaleLowerCase();
  if (baseLang == 'c++') {
    return 'cpp';
  }
  if (baseLang == 'python') {
    return 'python3';
  }

  return baseLang;
}

const JSON_LANG_TO_EXT: {[key: string]: string} = {
  'python': 'py',
  'text': 'txt',
  'python3': 'py',
  'ocaml': 'ml',
  'pascal': 'pas',
  'java': 'java',
  'java8': 'java',
  'javascool': 'jvs',
  'ada': 'adb',
  'cpp': 'cpp',
  'cpp11': 'cpp',
  'c': 'c',
  'cplex': 'mod',
  'shell': 'sh',
  'smartpy': 'py',
  'archetype': 'arl',
  'michelson': 'tz',
  'mligo': 'ml',
  'jsligo': 'js',
};

export interface JobData {
  extraTests: any[],
  extraParams: {
    solutionContent: string,
    solutionDependencies: string,
    solutionExecId: string,
    solutionFilename: string,
    solutionFilterTests: string[],
    solutionId: string,
    solutionLanguage: string,
    defaultSolutionCompParams: {
      memoryLimitKb: number,
      timeLimitMs: number,
    },
    defaultSolutionExecParams: {
      memoryLimitKb: number,
      timeLimitMs: number,
    },
  },
  executions: any[],
  taskPath: string,
  options: {
    locale?: string,
  },
}

let sendQueueRequestToGraderQueue: (queueRequest: QueueRequest) => Promise<string> = async function (queueRequest: QueueRequest) {
  if (!appConfig.graderQueue.url) {
    throw new Error('Missing grader queue URL');
  }

  const gotResponse = await got.post(appConfig.graderQueue.url, {
    form: queueRequest,
  });

  return gotResponse.body;
};

export function setQueueRequestSender(queueRequestSender: (queueRequest: QueueRequest) => Promise<string>): void {
  sendQueueRequestToGraderQueue = queueRequestSender;
}

export async function sendSubmissionToTaskGrader(submissionId: string, submissionData: SubmissionParameters): Promise<void> {
  const queueRequest = await generateQueueRequest(submissionId, submissionData);

  let queueAnswer: string;

  try {
    queueAnswer = await sendQueueRequestToGraderQueue(queueRequest);
    log.debug('Queue answer', queueAnswer);
    // console.log(response.body);
  } catch (error) {
    throw new Error(`Cannot read graderqueue json return: ${String(error)}`);
  }

  const queueAnswerData = JSON.parse(queueAnswer) as {errorcode: number, errormsg?: string};
  if (queueAnswerData.errorcode !== 0) {
    throw new Error(`Received error from graderqueue: ${queueAnswerData['errormsg'] || ''}`);
  }
}

export interface QueueRequest {
  request?: string,
  priority?: number,
  taskrevision?: string,
  tags?: string,
  jobname?: string,
  jobdata?: string,
  jobusertaskid?: string,
  debugPassword?: string,
  sToken?: string,
  sPlatform?: string,
}

export async function generateQueueRequest(submissionId: string, submissionData: SubmissionParameters): Promise<QueueRequest> {
  const params = await getPlatformTokenParams(submissionData.taskId, submissionData.token, submissionData.platform);
  let idUserAnswer = null;
  let answerTokenParams: PlatformTokenParameters|null = null;
  if (submissionData.answerToken) {
    answerTokenParams = await getPlatformTokenParams(submissionData.taskId, submissionData.answerToken, submissionData.platform);
    if (answerTokenParams.idUserAnswer) {
      idUserAnswer = answerTokenParams.idUserAnswer;
    }
  }

  if (answerTokenParams && !appConfig.testMode.enabled) {
    if (answerTokenParams.idUser !== params.idUser || answerTokenParams.itemUrl !== params.itemUrl) {
      throw new InvalidInputError(`Mismatching tokens idUser or itemUrl, token = ${JSON.stringify(params)}, answerToken = ${JSON.stringify(answerTokenParams)}`);
    }
    if (!answerTokenParams.sAnswer) {
      throw new InvalidInputError('Missing answer in answerToken');
    }
    const decodedAnswer = JSON.parse(answerTokenParams.sAnswer) as {idSubmission?: string};
    if (!('idSubmission' in decodedAnswer) || decodedAnswer['idSubmission'] !== submissionId) {
      throw new InvalidInputError('Impossible to read submission associated with answer token or submission ID mismatching');
    }
    if (false === params.bSubmissionPossible || false === params.bAllowGrading) {
      throw new InvalidInputError('Token indicates read-only task');
    }
  }

  const returnUrl = submissionData?.taskParams?.returnUrl ?? params.returnUrl;

  if (returnUrl || idUserAnswer) {
    await Db.execute('update tm_submissions set sReturnUrl = :returnUrl, idUserAnswer = :idUserAnswer WHERE tm_submissions.`ID` = :idSubmission and tm_submissions.idUser = :idUser and tm_submissions.idPlatform = :idPlatform and tm_submissions.idTask = :idTask;', {
      idUser: params.idUser,
      idTask: params.idTaskLocal,
      idPlatform: params.idPlatform,
      idSubmission: submissionId,
      returnUrl,
      idUserAnswer,
    });
  }

  const submission = await Db.querySingleResult<Submission>(`SELECT tm_submissions.*
FROM tm_submissions
    JOIN tm_tasks on tm_tasks.ID = tm_submissions.idTask
    JOIN tm_source_codes on tm_source_codes.ID = tm_submissions.idSourceCode
WHERE tm_submissions.ID = :idSubmission
  and tm_submissions.idUser = :idUser
  and tm_submissions.idPlatform = :idPlatform
  and tm_submissions.idTask = :idTask;`, {
    idUser: params.idUser,
    idTask: params.idTaskLocal,
    idPlatform: params.idPlatform,
    idSubmission: submissionId,
  });
  if (null === submission) {
    throw new InvalidInputError('Cannot find submission ' + submissionId);
  }

  const task = await findTaskById(params.idTaskLocal);
  if (null === task) {
    throw new InvalidInputError(`Cannot find task with id ${params.idTaskLocal}`);
  }
  const sourceCode = await findSourceCodeById(submission.idSourceCode);
  if (null === sourceCode) {
    throw new InvalidInputError('Cannot find source code associated with this submission');
  }

  if (!submissionData.answerToken && !appConfig.testMode.enabled && 'UserTest' !== submission.sMode) {
    throw new InvalidInputError('Missing answerToken, required for this type of submission');
  }

  let tests: TaskTest[] = [];
  if ('UserTest' === submission.sMode) {
    tests = await Db.execute<TaskTest[]>('SELECT tm_tasks_tests.* FROM tm_tasks_tests WHERE idUser = :idUser and idPlatform = :idPlatform and idTask = :idTask and idSubmission = :idSubmission ORDER BY iRank ASC', {
      idUser: params.idUser,
      idTask: params.idTaskLocal,
      idPlatform: params.idPlatform,
      idSubmission: submissionId,
    });
  }

  const sourceCodeParams = JSON.parse(sourceCode.sParams) as {sLangProg: string};
  const baseLang = sourceCodeParams['sLangProg'];
  const lang = baseLangToJSONLang(baseLang);

  let fileName = submissionId + '.' + JSON_LANG_TO_EXT[lang];
  if ('ada' === baseLang) {
    // ADA needs letters for the file name
    fileName = 'source-' + submissionId.replace(/[0-9]/g, number => String.fromCharCode(97+Number(number))).substring(0, 5) + '.adb';
  }

  const limits = await Db.execute<TaskLimitModel[]>("SELECT * FROM tm_tasks_limits WHERE idTask = :idTask AND (sLangProg = :baseLang OR sLangProg = '*')", {
    idTask: submission.idTask,
    baseLang,
  });
  let limit: TaskLimit|undefined = limits.find(limit => limit.sLangProg === baseLang);
  if (!limit) {
    limit = limits.find(limit => limit.sLangProg === '*');
  }
  if (!limit) {
    limit = {
      iMaxTime: 1000,
      iMaxMemory: 20000
    };
  }

  let jobData: JobData;
  if (task.bTestMode) {
    tests = JSON.parse(sourceCode.sSource) as TaskTest[];

    jobData = JSON.parse('{"taskPath": "","extraParams": {"defaultFilterTests": ["user-*.in"]},"extraTests": [],"solutions": "@testEvaluationSolutions","executions": "@testEvaluationExecutions"}') as JobData;
    if (tests.length) {
      jobData['extraTests'] = [];
      for (const test of tests) {
        jobData['extraTests'].push({
          name: `user-${test.sName}.in`,
          content: test.sInput,
        });
      }
    }
  } else {
    let depLang = lang;
    if (depLang === 'cpp11') {
      depLang = 'cpp';
    }

    jobData = JSON.parse(`{"taskPath":"","extraParams": {"solutionFilename": "${fileName}","solutionContent": "","solutionLanguage": "${lang}","solutionDependencies": "@defaultDependencies-${depLang}","solutionFilterTests":"@defaultFilterTests-${depLang}","solutionId": "sol0-${fileName}","solutionExecId": "exec0-${fileName}","defaultSolutionCompParams": {"memoryLimitKb":"","timeLimitMs":"","stdoutTruncateKb":-1,"stderrTruncateKb":-1,"useCache":true,"getFiles":[]},"defaultSolutionExecParams": {"memoryLimitKb":"","timeLimitMs":"","stdoutTruncateKb":-1,"stderrTruncateKb":-1,"useCache":true,"getFiles":[]}}}`) as JobData;
    jobData['extraParams']['solutionContent'] = sourceCode.sSource;
    // Compilation time/memory limits (fixed)
    jobData['extraParams']['defaultSolutionCompParams']['memoryLimitKb'] = 131072;
    jobData['extraParams']['defaultSolutionCompParams']['timeLimitMs'] = 10000;
    // Execution time/memory limits (configured by the task)
    jobData['extraParams']['defaultSolutionExecParams']['memoryLimitKb'] = Number(limit.iMaxMemory);
    jobData['extraParams']['defaultSolutionExecParams']['timeLimitMs'] = Number(limit.iMaxTime);

    if (tests.length) {
      jobData['extraTests'] = [];
      jobData['extraParams']['solutionFilterTests'] = ['id-*.in'];
      jobData['executions'] = [{
        id: 'testExecution',
        idSolution: '@solutionId',
        filterTests: ['id-*.in'],
        runExecution: '@defaultSolutionExecParams',
      }];
      for (const test of tests) {
        jobData['extraTests'].push({
          name: `id-${test.ID}.in`,
          content: test.sInput,
        });
        jobData['extraTests'].push({
          name: `id-${test.ID}.out`,
          content: test.sOutput,
        });
      }
    }
  }

  jobData['taskPath'] = task.sTaskPath;
  jobData['options'] = {
    locale: submissionData.sLocale,
  };

  // When this is a test user, avoid blocking the grader queue because several people use
  // the grader queue at the same time. If several users use the grader queue at the same time
  // on the same task outside a platform, they will all have the same jobUserTaskId, and this
  // is problematic since the grader queue will re-start the submission everytime and cancel the previous
  // ones made with this identifier. To prevent this, we generate a random identifier.
  const idUser = appConfig.testMode.userId === submission.idUser ? getRandomId() : submission.idUser;
  const jobUserTaskId = `${submission.idTask}-${idUser}-${submission.idPlatform}`;

  let evalTags = task.sEvalTags;
  if (!evalTags && appConfig.graderQueue.defaultTags) {
    evalTags = appConfig.graderQueue.defaultTags;
  }

  const queueRequestParams = {
    request: 'sendjob',
    priority: 1,
    taskrevision: task.sRevision,
    tags: evalTags,
    jobname: submissionId,
    jobdata: JSON.stringify(jobData),
    jobusertaskid: jobUserTaskId,
  };

  // console.log('queue request', queueRequestParams);

  let queueRequest;

  if (appConfig.graderQueue.debugPassword) {
    // Use debug password to send plain request
    queueRequest = {
      ...queueRequestParams,
      debugPassword: appConfig.graderQueue.debugPassword,
    };
  } else {
    // Generate encrypted and signed token for the request
    const tokenGenerator = new TokenGenerator();
    await tokenGenerator.setKeys(appConfig.graderQueue.ownPrivateKey, appConfig.graderQueue.publicKey);
    const jwe = await tokenGenerator.encodeJwes(queueRequestParams);

    queueRequest = {
      sToken: jwe,
      sPlatform: appConfig.graderQueue.ownName,
    };
  }

  return queueRequest;
}
