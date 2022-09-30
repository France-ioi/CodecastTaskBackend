import {decode, getRandomId} from './util';
import {findSubmissionById} from './submissions';
import {pipe} from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import {JwesDecoder} from './crypto/jwes_decoder';
import * as Db from './db';
import {TaskSubtask, TaskTest} from './db_models';
import {findTaskById} from './tasks';

export const taskGraderWebhookPayloadDecoder = pipe(
  D.struct({
    sToken: D.string,
  }),
);
export type TaskGraderWebhookPayload = D.TypeOf<typeof taskGraderWebhookPayloadDecoder>;

export interface ProgramExecutionResult {
  noFeedback: boolean,
  exitSig: number,
  exitCode: number,
  continueOnError?: boolean,
  stdout: {
    data: string,
  },
  stderr: {
    data: string,
  },
  files: any,
  timeTakenMs: number,
  memoryUsedKb: number,
}

export interface GraderResultExecution {
  id: number,
  name: string,
  testReports: {
    name: string,
    execution?: ProgramExecutionResult,
    checker?: ProgramExecutionResult,
    extraChecker?: ProgramExecutionResult,
    sanitizer: ProgramExecutionResult,
  }[],
}

export interface TokenParams {
  sTaskName: string,
  sResultData: {
    executions: GraderResultExecution[],
    solutions: {
      compilationExecution: ProgramExecutionResult,
    }[],
  },
}

async function createNewTest(idSubmission: string, idTask: string, testName: string): Promise<TaskTest> {
  let maxRank = await Db.querySingleScalarResult<number>(`SELECT MAX(tm_tasks_tests.iRank) from tm_tasks_tests
  JOIN tm_submissions ON tm_submissions.idTask = tm_tasks_tests.idTask
  WHERE tm_submissions.ID = :idSubmission and tm_tasks_tests.sGroupType = 'Evaluation';`, {
    idSubmission,
  });

  if (null === maxRank) {
    maxRank = 0;
  }

  const ID = getRandomId();

  await Db.execute('INSERT INTO tm_tasks_tests (ID, idTask, sGroupType, iRank, bActive, sName) values (:ID, :idTask, \'Evaluation\', :iRank, 1, :sName)', {
    ID,
    idTask,
    iRank: maxRank + 1,
    sName: testName,
  });

  return {
    ID,
    idTask,
    idSubmission,
    sName: testName,
    sGroupType: 'Evaluation',
    iRank: maxRank + 1,
    sOutput: '',
    idSubtask: null,
    idUser: null,
    idPlatform: null,
    bActive: true,
    sInput: '',
    iVersion: 0,
  };
}

export async function receiveSubmissionResultsFromTaskGrader(taskGraderWebhookPayload: unknown): Promise<void> {
  const taskGraderWebhookParams: TaskGraderWebhookPayload = decode(taskGraderWebhookPayloadDecoder)(taskGraderWebhookPayload);

  const jwesDecoder = new JwesDecoder();
  await jwesDecoder.setKeys(process.env.GRADER_QUEUE_PUBLIC_KEY, process.env.GRADER_QUEUE_OWN_PRIVATE_KEY);
  const tokenParams = await jwesDecoder.decodeJwes(taskGraderWebhookParams.sToken) as TokenParams;

  const submission = await findSubmissionById(tokenParams.sTaskName);
  if (null === submission) {
    throw new Error(`Cannot find submission ${tokenParams.sTaskName}`);
  }

  const task = await findTaskById(submission.idTask);
  if (null === task) {
    throw new Error(`Cannot find task ${submission.idTask}`);
  }

  const allTests = await Db.execute<TaskTest[]>(`SELECT tm_tasks_tests.sName, tm_tasks_tests.ID, tm_tasks_tests.sGroupType, tm_tasks_tests.iRank, tm_tasks_tests.sOutput from tm_tasks_tests
    JOIN tm_submissions ON tm_submissions.idTask = tm_tasks_tests.idTask
    WHERE tm_submissions.ID = :idSubmission and ((tm_tasks_tests.sGroupType = 'Evaluation' or tm_tasks_tests.sGroupType = 'Submission') or (tm_tasks_tests.sGroupType = 'User' and tm_tasks_tests.idUser = tm_submissions.idUser and tm_tasks_tests.idPlatform = tm_submissions.idPlatform));`,
  {
    idSubmission: tokenParams.sTaskName
  });

  const testsByName: {[key: string]: TaskTest} = {};
  // This is a bit odd: when submitting answer for evaluation, the resulting
  // json contains the names of the tests, but when the submission is with user tests,
  // it contains names like id-xxx where xxx is the ID of the tm_task_test
  for (const test of allTests) {
    if ('Submission' === test.sGroupType) {
      testsByName[`id-${test.ID}`] = test;
    } else {
      testsByName[test.sName] = test;
    }
  }

  const graderResults = tokenParams.sResultData;
  let nbTestsPassed = 0;
  let iScoreTotal = 0;
  let nbTestsTotal = 0;
  let bCompilError = false;
  let sCompilMsg = graderResults?.solutions[0]?.compilationExecution?.stderr?.data ? graderResults?.solutions[0]?.compilationExecution?.stderr.data : '';
  let sErrorMsg = '';
  let iScore = 0;

  if (task.bTestMode) {
    sCompilMsg = '';
    let nbTestsFailedTotal = 0;
    const invalidTests: {[testName: string]: boolean} = {};
    for (const execution of graderResults.executions) {
      nbTestsTotal++;
      if (!(execution.name in testsByName)) {
        testsByName[execution.name] = await createNewTest(tokenParams.sTaskName, task.ID, execution.name);
      }

      const test = testsByName[execution.name];
      let nbTestFailed = 0;
      for (const testReport of execution.testReports) {
        const testName = testReport.name.substring(5);
        if (!testReport.checker) {
          if (!(testName in invalidTests)) {
            invalidTests[testName] = true;
            bCompilError = true;
            const thisCompilMsg = testReport.sanitizer.stdout.data;
            sCompilMsg += `
Erreur dans le test : ${testName}
${thisCompilMsg}`;
          }
        } else {
          const outData = testReport.checker.stdout.data;
          const iScore = Number(outData.split('\n')[0]);
          if (0 === iScore) {
            nbTestFailed++;
          }
        }
      }

      let iErrorCode: number;
      let sLog: string;
      if (nbTestFailed) {
        nbTestsFailedTotal++;
        iScore = 100;
        iErrorCode = 0;
        sLog = `${nbTestFailed} de vos tests permet${nbTestFailed > 1 ? 'tent' : ''} de détecter l'erreur de cette solution.`;
      } else {
        iScore = 0;
        iErrorCode = 1;
        sLog = 'Aucun de vos tests ne permet de détecter l\'erreur de cette solution.';
      }

      await Db.execute('insert ignore into tm_submissions_tests (idSubmission, iErrorCode, idTest, iScore, sLog) values (:idSubmission, :iErrorCode, :idTest, :iScore, :sLog);', {
        idSubmission: tokenParams.sTaskName,
        idTest: test.ID,
        iScore,
        iErrorCode,
        sLog,
      });
    }

    iScore = 100 * nbTestsFailedTotal / nbTestsTotal;
    const bSuccess = (nbTestsFailedTotal === nbTestsTotal);

    await Db.execute('UPDATE tm_submissions SET nbTestsPassed = :nbTestsPassed, iScore = :iScore, nbTestsTotal = :nbTestsTotal, bCompilError = :bCompilError, bSuccess = :bSuccess, sCompilMsg = :sCompilMsg, sErrorMsg = :sErrorMsg, bEvaluated = \'1\' WHERE id = :sName', {
      sName: tokenParams.sTaskName,
      nbTestsPassed: nbTestsFailedTotal,
      iScore,
      nbTestsTotal,
      bCompilError,
      sErrorMsg: '',
      sCompilMsg,
      bSuccess,
    });
  } else {
    const minScoreToValidateTest = Number(task.iTestsMinSuccessScore);

    if (graderResults.solutions[0].compilationExecution.exitCode != 0 && !graderResults.solutions[0].compilationExecution?.continueOnError) {
      bCompilError = true;
      // sCompilMsg is set earlier
    } else {
      let testsReports = [];
      const testReportToSubtask: {id: string, iPointsMax: number, name: string}[] = [];
      const minPointsSubtask: {[key: string]: number} = {};
      const maxPointsSubtask: {[key: string]: number} = {};

      if (graderResults.executions.length > 1) {
        // get task subtasks
        const subtasks = await Db.execute<TaskSubtask[]>('SELECT ID, name, iPointsMax from tm_tasks_subtasks WHERE idTask = :idTask AND bActive = 1 ORDER BY iRank ASC;', {
          idTask: submission.idTask,
        });

        const subTasksByNameOrIndex: {[key: string|number]: TaskSubtask} = {};

        const nbSubtasks = subtasks.length;
        for (const [index, subtask] of subtasks.entries()) {
          subTasksByNameOrIndex[index] = subtask;
          subTasksByNameOrIndex[subtask.name] = subtask;
        }

        if (graderResults.executions.length <= nbSubtasks) {
          let executionI = 0;
          let nbTestsReports = 0;

          for (const execution of graderResults.executions) {
            // create submission subtask
            // bSuccess and iScore will be set later to avoid analyzing testsReports twice
            let curSubtask = subtasks[executionI];
            if (execution.id in subtasks) {
              curSubtask = subtasks[execution.id];
            }
            const idSubtask = curSubtask.ID;

            const submSubtaskId: string = await Db.execute('INSERT INTO tm_submissions_subtasks (bSuccess, iScore, idSubtask, idSubmission) VALUES(0, 0, :idSubtask, :idSubmission);', {
              idSubtask,
              idSubmission: submission.ID,
            });

            minPointsSubtask[submSubtaskId] = curSubtask.iPointsMax;
            maxPointsSubtask[submSubtaskId] = curSubtask.iPointsMax;

            for (const testReport of execution.testReports) {
              testsReports[nbTestsReports] = testReport;
              testReportToSubtask.push({
                id: submSubtaskId,
                iPointsMax: curSubtask.iPointsMax,
                name: String(execution.id),
              });
              nbTestsReports++;
            }

            executionI++;
          }
        } else {
          // ignore subtasks, we have more executions than subtasks
          for (const execution of graderResults.executions) {
            for (const testReport of execution.testReports) {
              testReport.name = `${execution.id}-${testReport.name}`;
              testsReports.push(testReport);
            }
          }
        }
      } else {
        // there are as many executions as there are sources to evaluate, so here
        // we use only one:
        testsReports = graderResults.executions[0].testReports;
      }

      for (const [index, testReport] of testsReports.entries()) {
        nbTestsTotal++;

        // Read submission subtask ID
        let subtaskId: string|null = null;
        let testReportName = testReport.name;
        if (testReportToSubtask.length) {
          subtaskId = testReportToSubtask[index].id;
          testReportName = testReportToSubtask[index].name + '-' + testReportName;
        }

        if (!(testReportName in testsByName)) {
          if (testReportName.substring(0, 3) === 'id-') {
            throw new Error(`cannot find test ${testReportName} for submission ${submission.ID}`);
          }

          testsByName[testReportName] = await createNewTest(tokenParams.sTaskName, task.ID, testReportName);
        }

        const test = testsByName[testReportName];
        let iErrorCode = testReport?.execution?.exitSig;
        if (iErrorCode) {
          iErrorCode = 1;
        }

        let bNoFeedback = 0;
        if (!testReport.checker) {
          if (testReport.execution) {
            // test produces an error in the code
            if (testReport.extraChecker) {
              sErrorMsg = testReport.extraChecker.stdout.data;
            } else {
              sErrorMsg = testReport.execution.stderr.data;
            }

            bNoFeedback = testReport.execution?.noFeedback ? 1 : 0;

            await Db.execute('insert ignore into tm_submissions_tests (idSubmission, idTest, iScore, iTimeMs, iMemoryKb, iErrorCode, sErrorMsg, sExpectedOutput, idSubmissionSubtask, bNoFeedback) values (:idSubmission, :idTest, :iScore, :iTimeMs, :iMemoryKb, :iErrorCode, :sErrorMsg, :sExpectedOutput, :idSubmissionSubtask, :bNoFeedback);', {
              idSubmission: tokenParams.sTaskName,
              idTest: test.ID,
              iScore: 0,
              iTimeMs: testReport.execution.timeTakenMs,
              iMemoryKb: testReport.execution.memoryUsedKb,
              iErrorCode,
              sExpectedOutput: test.sOutput,
              sErrorMsg,
              idSubmissionSubtask: subtaskId,
              bNoFeedback,
            });
          } else {
            sErrorMsg = testReport.sanitizer.stderr.data;
            break; // TODO: ?
          }
          iScore = 0;
        } else {
          const outData = testReport.checker?.stdout.data;
          const lines = outData.split('\n');
          iScore = Number(lines[0]);
          let testLog = '';
          if (1 < lines.length) {
            testLog = lines.slice(1).join('\n');
          }
          const bNoFeedback = (iScore < 100 && testReport.checker.noFeedback) ? 1 : 0;
          const files = JSON.stringify(testReport.checker.files);
          if (iScore >= minScoreToValidateTest) {
            nbTestsPassed++;
            iErrorCode = 0;
          } else {
            iErrorCode = 1;
          }
          iScoreTotal += iScore;
          const sOutput = testReport.execution?.stdout.data.trimEnd();

          await Db.execute('insert ignore into tm_submissions_tests (idSubmission, idTest, iScore, iTimeMs, iMemoryKb, iErrorCode, sOutput, sExpectedOutput, sErrorMsg, sLog, jFiles, idSubmissionSubtask, bNoFeedback) values (:idSubmission, :idTest, :iScore, :iTimeMs, :iMemoryKb, :iErrorCode, :sOutput, :sExpectedOutput, :sErrorMsg, :sLog, :jFiles, :idSubmissionSubtask, :bNoFeedback);', {
            idSubmission: tokenParams.sTaskName,
            idTest: test.ID,
            iScore,
            iTimeMs: testReport.execution?.timeTakenMs,
            iMemoryKb: testReport.execution?.memoryUsedKb,
            iErrorCode,
            sOutput,
            sExpectedOutput: test.sOutput,
            sErrorMsg: testReport.execution?.stderr.data,
            sLog: testLog,
            jFiles: files,
            idSubmissionSubtask: subtaskId,
            bNoFeedback,
          });
        }

        if (index in testReportToSubtask && null !== subtaskId) {
          minPointsSubtask[subtaskId] = Math.min(minPointsSubtask[subtaskId], Math.round(iScore * testReportToSubtask[index].iPointsMax / 100));
        }
      }

      // Handle scores
      if (Object.keys(minPointsSubtask).length) {
        // Save scores for each subtask
        iScore = 0;
        for (const [subtaskId, subScore] of Object.entries(minPointsSubtask)) {
          const bSuccess = (subScore == maxPointsSubtask[subtaskId]) ? 1 : 0;

          await Db.execute('UPDATE tm_submissions_subtasks SET bSuccess = :bSuccess, iScore = :iScore WHERE ID = :ID;', {
            bSuccess,
            iScore: subScore,
            ID: subtaskId,
          });

          // Final score is the sum of each subtask's score
          iScore += subScore;
        }
      } else if (nbTestsTotal) {
        iScore = Math.round(iScoreTotal / nbTestsTotal);
      } else {
        iScore = 0;
      }
    }

    const bSuccess = (iScore > 99);

    await Db.execute('UPDATE tm_submissions SET nbTestsPassed = :nbTestsPassed, iScore = :iScore, nbTestsTotal = :nbTestsTotal, bCompilError = :bCompilError, bSuccess = :bSuccess, sCompilMsg = :sCompilMsg, sErrorMsg = :sErrorMsg, bEvaluated = \'1\' WHERE id = :sName', {
      sName: tokenParams.sTaskName,
      nbTestsPassed,
      iScore,
      nbTestsTotal,
      bCompilError,
      sErrorMsg,
      sCompilMsg,
      bSuccess,
    });
  }
}

// $itemUrl = $config->baseUrl.'task.html?taskId='.$task['ID'];
//
// if ($task['sReturnUrl'] && $task['sMode'] != 'UserTest') {
//   sendResultsToReturnUrl($task['sTextId'], $task['idUser'], $iScore, $tokenParams['sTaskName'], $task['sReturnUrl'], $itemUrl, $task['idUserAnswer']);
// }
//
// echo json_encode(array('bSuccess' => true));
