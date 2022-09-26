// import {PlatformTokenParameters} from './tokenization';
// import {findSourceCodeById, getPlatformTokenParams, SubmissionParameters} from './submissions';
// import * as Db from './db';
// import {findTaskById} from './tasks';
// import {Submission, TaskLimit, TaskTest} from './models';

// function baseLangToJSONLang(baseLang: string): string {
//   baseLang = baseLang.toLocaleLowerCase();
//   if (baseLang == 'c++') {
//     return 'cpp';
//   }
//   if (baseLang == 'python') {
//     return 'python3';
//   }
//
//   return baseLang;
// }
//
// const JSON_LANG_TO_EXT: {[key: string]: string} = {
//   'python': 'py',
//   'text': 'txt',
//   'python3': 'py',
//   'ocaml': 'ml',
//   'pascal': 'pas',
//   'java': 'java',
//   'java8': 'java',
//   'javascool': 'jvs',
//   'ada': 'adb',
//   'cpp': 'cpp',
//   'cpp11': 'cpp',
//   'c': 'c',
//   'cplex': 'mod',
//   'shell': 'sh',
// };

// export async function sendSubmissionToTaskGrader(submissionId: string, submissionData: SubmissionParameters): Promise<void> {
//   const params = await getPlatformTokenParams(submissionData.token, submissionData.platform, submissionData.taskId);
//   let idUserAnswer = null;
//   let answerTokenParams: PlatformTokenParameters|null = null;
//   if (submissionData.answerToken) {
//     answerTokenParams = await getPlatformTokenParams(submissionData.answerToken, submissionData.platform, submissionData.taskId);
//     if (answerTokenParams.idUserAnswer) {
//       idUserAnswer = answerTokenParams.idUserAnswer;
//     }
//   }
//
//   if (answerTokenParams && !process.env.TEST_MODE) {
//     if (answerTokenParams.idUser !== params.idUser || answerTokenParams.itemUrl !== params.itemUrl) {
//       throw `Mismatching tokens idUser or itemUrl, token = ${JSON.stringify(params)}, answerToken = ${JSON.stringify(answerTokenParams)}`;
//     }
//     if (!answerTokenParams.sAnswer) {
//       throw 'Missing answer in answerToken';
//     }
//     const decodedAnswer: unknown = JSON.parse(answerTokenParams.sAnswer);
//     if (!decodedAnswer['idSubmission'] || decodedAnswer['idSubmission'] !== submissionId) {
//       throw 'Impossible to read submission associated with answer token or submission ID mismatching';
//     }
//     if (false === params.bSubmissionPossible || false === params.bAllowGrading) {
//       throw 'Token indicates read-only task';
//     }
//   }
//
//   let returnUrl = null;
//   if (submissionData?.taskParams?.returnUrl) {
//     returnUrl = submissionData.taskParams.returnUrl;
//   } else if (params.returnUrl) {
//     returnUrl = params.returnUrl;
//   }
//
//   if (returnUrl || idUserAnswer) {
//     await Db.execute('update tm_submissions set sReturnUrl = :returnUrl, idUserAnswer = :idUserAnswer WHERE tm_submissions.`ID` = :idSubmission and tm_submissions.idUser = :idUser and tm_submissions.idPlatform = :idPlatform and tm_submissions.idTask = :idTask;', {
//       idUser: params.idUser,
//       idTask: params.idTaskLocal,
//       idPlatform: params.idPlatform,
//       idSubmission: submissionId,
//       returnUrl,
//       idUserAnswer,
//     });
//   }
//
//   const result = await Db.execute<Submission[]>(`SELECT tm_submissions.*
// FROM tm_submissions
//     JOIN tm_tasks on tm_tasks.ID = tm_submissions.idTask
//     JOIN tm_source_codes on tm_source_codes.ID = tm_submissions.idSourceCode
// WHERE tm_submissions.ID = :idSubmission
//   and tm_submissions.idUser = :idUser
//   and tm_submissions.idPlatform = :idPlatform
//   and tm_submissions.idTask = :idTask;`, {
//     idUser: params.idUserAnswer,
//     idTask: params.idTaskLocal,
//     idPlatform: params.idPlatform,
//     idSubmission: submissionId,
//   });
//   if (!result.length) {
//     throw 'Cannot find submission ' + submissionId;
//   }
//
//   const submission = {...result[0]};
//   const task = await findTaskById(params.idTaskLocal);
//   const sourceCode = await findSourceCodeById(submission.idSourceCode);
//
//   if (!submissionData.answerToken && !process.env.TEST_MODE && 'UserTest' !== submission.sMode) {
//     throw 'Missing answerToken, required for this type of submission';
//   }
//
//   let tests: TaskTest[] = [];
//   if ('UserTest' === submission.sMode) {
//     tests = await Db.execute<TaskTest[]>('SELECT tm_tasks_tests.* FROM tm_tasks_tests WHERE idUser = :idUser and idPlatform = :idPlatform and idTask = :idTask and idSubmission = :idSubmission', {
//       idUser: params.idUser,
//       idTask: params.idTaskLocal,
//       idPlatform: params.idPlatform,
//       idSubmission: submissionId,
//     });
//   }
//
//   const baseLang = JSON.parse(sourceCode.sParams)['sLangProg'];
//   const lang = baseLangToJSONLang(baseLang);
//
//   let fileName = submissionId + '.' + JSON_LANG_TO_EXT[lang];
//   if ('ada' === baseLang) {
//     // ADA needs letters for the file name
//     fileName = 'source-' + submissionId.replace(/[0-9]/g, number => String.fromCharCode(97+Number(number))).substring(0, 5) + '.adb';
//   }
//
//   const limits = await Db.execute<TaskLimit[]>('SELECT * FROM tm_tasks_limits WHERE idTask = :idTask;', {
//     idTask: submission.idTask,
//   });
//   let limit = limits.find(limit => limit.sLangProg === baseLang);
//   if (!limit) {
//     limit = limits.find(limit => limit.sLangProg === '*');
//   }
//   if (!limit) {
//     limit = {
//       constructor: {name: 'RowDataPacket'},
//       iMaxTime: 1000,
//       iMaxMemory: 20000
//     };
//   }
//
//   let jobData: {extraTests: any[], extraParams: any, executions: any[]};
//   if (task.bTestMode) {
//     tests = JSON.parse(sourceCode.sSource);
//
//     jobData = JSON.parse('{"taskPath": "","extraParams": {"defaultFilterTests": ["user-*.in"]},"extraTests": [],"solutions": "@testEvaluationSolutions","executions": "@testEvaluationExecutions"}');
//     if (tests.length) {
//       jobData['extraTests'] = [];
//       for (const test of tests) {
//         jobData['extraTests'].push({
//           name: `user-${test.sName}.in`,
//           content: test.sInput,
//         });
//       }
//     }
//   } else {
//     let depLang = lang;
//     if (depLang === 'cpp11') {
//       depLang = 'cpp';
//     }
//
//     jobData = JSON.parse(`{"taskPath":"","extraParams": {"solutionFilename": "${fileName}","solutionContent": "","solutionLanguage": "${lang}","solutionDependencies": "@defaultDependencies-${depLang}","solutionFilterTests":"@defaultFilterTests-${depLang}","solutionId": "sol0-${fileName}","solutionExecId": "exec0-${fileName}","defaultSolutionCompParams": {"memoryLimitKb":"","timeLimitMs":"","stdoutTruncateKb":-1,"stderrTruncateKb":-1,"useCache":true,"getFiles":[]},"defaultSolutionExecParams": {"memoryLimitKb":"","timeLimitMs":"","stdoutTruncateKb":-1,"stderrTruncateKb":-1,"useCache":true,"getFiles":[]}}}`);
//     jobData['extraParams']['solutionContent'] = sourceCode.sSource;
//     // Compilation time/memory limits (fixed)
//     jobData['extraParams']['defaultSolutionCompParams']['memoryLimitKb'] = 131072;
//     jobData['extraParams']['defaultSolutionCompParams']['timeLimitMs'] = 10000;
//     // Execution time/memory limits (configured by the task)
//     jobData['extraParams']['defaultSolutionExecParams']['memoryLimitKb'] = Number(limit.iMaxMemory);
//     jobData['extraParams']['defaultSolutionExecParams']['timeLimitMs'] = Number(limit.iMaxTime);
//
//     if (tests.length) {
//       jobData['extraTests'] = [];
//       jobData['extraParams']['solutionFilterTests'] = ['id-*.in'];
//       jobData['executions'] = [{
//         id: 'testExecution',
//         idSolution: '@solutionId',
//         filterTests: ['id-*.in'],
//         runExecution: '@defaultSolutionExecParams',
//       }];
//       for (const test of tests) {
//         jobData['extraTests'].push({
//           name: `id-${test.ID}.in`,
//           content: test.sInput,
//         });
//         jobData['extraTests'].push({
//           name: `id-${test.ID}.out`,
//           content: test.sOutput,
//         });
//       }
//     }
//   }
//
//   jobData['taskPath'] = task.sTaskPath;
//   jobData['options'] = {
//     locale: submissionData.sLocale,
//   };
//
//   const jobUserTaskId = `${submission.idTask}-${submission.idUser}-${submission.idPlatform}`;
//
//   let evalTags = task.sEvalTags;
//   if (!evalTags && process.env.GRADER_QUEUE_DEFAULT_TAGS) {
//     evalTags = process.env.GRADER_QUEUE_DEFAULT_TAGS;
//   }
//
//   const queueRequest = {
//     request: 'sendjob',
//     priority: 1,
//     taskrevision: task.sRevision,
//     tags: evalTags,
//     jobname: submissionId,
//     jobdata: JSON.stringify(jobData),
//     jobusertaskid: jobUserTaskId,
//   };
// }

// if($config->graderqueue->debug == '') {
//     // Generate encrypted and signed token for the request
//     $tokenGenerator = new TokenGenerator($config->graderqueue->own_private_key,
//         $config->graderqueue->own_name,
//         'private',
//         $config->graderqueue->public_key,
//         $config->graderqueue->name,
//         'public'
//     );
//
//     $jwe = $tokenGenerator->encodeJWES($queueRequest);
//
//     $queueRequest = array(
//         'sToken' => $jwe,
//         'sPlatform' => $config->graderqueue->own_name
// );
// } else {
//     // Use debug password to send plain request
//     $queueRequest['debugPassword'] = $config->graderqueue->debug;
// }
//
// // Send request
// $ch = curl_init();
//
// curl_setopt($ch, CURLOPT_URL,$config->graderqueue->url);
// curl_setopt($ch, CURLOPT_POST, 1);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($queueRequest));
//
// $queueAnswer = curl_exec ($ch);
//
// curl_close ($ch);
//
// // Read answer
// try {
//     $queueAnswerData = json_decode($queueAnswer, true);
//     if ($queueAnswerData['errorcode'] == 0) {
//         $result = ['bSuccess' => true];
//     } else {
//         $result = ['bSuccess' => false, 'sError' => 'Received error from graderqueue: ' . $queueAnswerData['errormsg']];
//     }
// } catch(Exception $e) {
//     $result = ['bSuccess' => false, 'sError' => 'Cannot read graderqueue json return: ' . $e->getMessage()];
// }
//
// if($config->graderqueue->debug != '') {
//     $result['queueAnswer'] = $queueAnswer;
// }
//
// echo json_encode($result);
