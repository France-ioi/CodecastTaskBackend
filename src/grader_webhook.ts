import {decode, getRandomId} from './util';
import {findSubmissionById} from './submissions';
import {pipe} from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import {JwesDecoder} from './crypto/jwes_decoder';
import * as Db from './db';
import {TaskSubtask, TaskTest} from './db_models';
import {findTaskById} from './tasks';
import {longPollingHandler} from './long_polling';
import appConfig from './config';

export const taskGraderWebhookPayloadDecoder = pipe(
  D.struct({
    sToken: D.string,
  }),
);
export type TaskGraderWebhookPayload = D.TypeOf<typeof taskGraderWebhookPayloadDecoder>;

export interface ProgramExecutionResultMetadata {
  errorfile: number,
  errorline: number,
}

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
  metadata?: ProgramExecutionResultMetadata,
}

export interface GraderResultExecution {
  id: number,
  name: string,
  testsReports: {
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

async function createNewTest(idSubmission: string, idTask: string, testName: string, idSubtask: string|null): Promise<TaskTest> {
  let maxRank = await Db.querySingleScalarResult<number>(`SELECT MAX(tm_tasks_tests.iRank) from tm_tasks_tests
  JOIN tm_submissions ON tm_submissions.idTask = tm_tasks_tests.idTask
  WHERE tm_submissions.ID = :idSubmission and tm_tasks_tests.sGroupType = 'Evaluation';`, {
    idSubmission,
  });

  if (null === maxRank) {
    maxRank = 0;
  }

  const ID = getRandomId();

  await Db.execute('INSERT INTO tm_tasks_tests (ID, idTask, idSubtask, sGroupType, iRank, bActive, sName) values (:ID, :idTask, :idSubtask, \'Evaluation\', :iRank, 1, :sName)', {
    ID,
    idTask,
    idSubtask,
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
    idSubtask,
    idUser: null,
    idPlatform: null,
    bActive: 1,
    sInput: '',
    iVersion: 0,
    sClientId: null,
  };
}

export async function receiveSubmissionResultsFromTaskGrader(taskGraderWebhookPayload: unknown): Promise<void> {
  const taskGraderWebhookParams: TaskGraderWebhookPayload = decode(taskGraderWebhookPayloadDecoder)(taskGraderWebhookPayload);

  let tokenParams;
  if (appConfig.graderQueue.debugPassword) {
    tokenParams = JSON.parse(taskGraderWebhookParams.sToken) as TokenParams;
  } else {
    const jwesDecoder = new JwesDecoder();
    await jwesDecoder.setKeys(appConfig.graderQueue.publicKey, appConfig.graderQueue.ownPrivateKey);
    tokenParams = await jwesDecoder.decodeJwes(taskGraderWebhookParams.sToken) as TokenParams;
  }

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
    if ('Submission' === test.sGroupType || 'User' === test.sGroupType) {
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
  let sCompilMsg = graderResults?.solutions[0]?.compilationExecution?.stderr?.data ?? '';
  const sMetadata = graderResults?.solutions[0]?.compilationExecution?.metadata ? JSON.stringify(graderResults?.solutions[0]?.compilationExecution?.metadata) : null;
  let sErrorMsg = '';
  let iScore = 0;

  if (task.bTestMode) {
    sCompilMsg = '';
    let nbTestsFailedTotal = 0;
    const invalidTests: {[testName: string]: boolean} = {};
    for (const execution of graderResults.executions) {
      nbTestsTotal++;
      if (!(execution.name in testsByName)) {
        testsByName[execution.name] = await createNewTest(tokenParams.sTaskName, task.ID, execution.name, null);
      }

      const test = testsByName[execution.name];
      let nbTestFailed = 0;
      for (const testReport of execution.testsReports) {
        const testName = testReport.name.substring(5);
        if (!testReport.checker) {
          if (!(testName in invalidTests)) {
            invalidTests[testName] = true;
            bCompilError = true;
            const thisCompilMsg = testReport.sanitizer.stdout.data;
            sCompilMsg += `
Error executing this test: ${testName}
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
        sLog = `${nbTestFailed} of your tests allow finding the error in this solution.`;
      } else {
        iScore = 0;
        iErrorCode = 1;
        sLog = 'None of your tests allow finding the error in this solution.';
      }

      await Db.execute('insert ignore into tm_submissions_tests (ID, idSubmission, iErrorCode, idTest, iScore, sLog) values (:ID, :idSubmission, :iErrorCode, :idTest, :iScore, :sLog);', {
        ID: getRandomId(),
        idSubmission: tokenParams.sTaskName,
        idTest: test.ID,
        iScore,
        iErrorCode,
        sLog,
      });
    }

    iScore = 100 * nbTestsFailedTotal / nbTestsTotal;
    const bSuccess = (nbTestsFailedTotal === nbTestsTotal);

    await Db.execute('UPDATE tm_submissions SET nbTestsPassed = :nbTestsPassed, iScore = :iScore, nbTestsTotal = :nbTestsTotal, bCompilError = :bCompilError, bSuccess = :bSuccess, sCompilMsg = :sCompilMsg, sErrorMsg = :sErrorMsg, sMetadata = :sMetadata, bEvaluated = \'1\' WHERE id = :sName', {
      sName: tokenParams.sTaskName,
      nbTestsPassed: nbTestsFailedTotal,
      iScore,
      nbTestsTotal,
      bCompilError,
      sErrorMsg: '',
      sCompilMsg,
      sMetadata,
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
      const subTaskIdBySubmissionSubTaskId: {[key: string]: string} = {};

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

            const submSubtaskId = getRandomId();
            subTaskIdBySubmissionSubTaskId[submSubtaskId] = idSubtask;

            await Db.execute('INSERT INTO tm_submissions_subtasks (ID, bSuccess, iScore, idSubtask, idSubmission) VALUES(:submissionSubtaskId, 0, 0, :idSubtask, :idSubmission);', {
              submissionSubtaskId: submSubtaskId,
              idSubtask,
              idSubmission: submission.ID,
            });

            minPointsSubtask[submSubtaskId] = curSubtask.iPointsMax;
            maxPointsSubtask[submSubtaskId] = curSubtask.iPointsMax;

            for (const testReport of execution.testsReports) {
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
            for (const testReport of execution.testsReports) {
              testReport.name = `${execution.id}-${testReport.name}`;
              testsReports.push(testReport);
            }
          }
        }
      } else {
        // there are as many executions as there are sources to evaluate, so here
        // we use only one:
        testsReports = graderResults.executions[0].testsReports;
      }

      for (const [index, testReport] of testsReports.entries()) {
        nbTestsTotal++;

        // Read submission subtask ID
        let submissionSubtaskId: string|null = null;
        let testReportName = testReport.name;
        if (testReportToSubtask.length) {
          submissionSubtaskId = testReportToSubtask[index].id;
          testReportName = testReportToSubtask[index].name + '-' + testReportName;
        }

        if (!(testReportName in testsByName)) {
          if (testReportName.substring(0, 3) === 'id-') {
            throw new Error(`cannot find test ${testReportName} for submission ${submission.ID}`);
          }

          const subtaskId = submissionSubtaskId && submissionSubtaskId in subTaskIdBySubmissionSubTaskId ? subTaskIdBySubmissionSubTaskId[submissionSubtaskId] : null;
          testsByName[testReportName] = await createNewTest(tokenParams.sTaskName, task.ID, testReportName, subtaskId);
        }

        const test = testsByName[testReportName];
        let iErrorCode = testReport?.execution?.exitSig;
        if (!iErrorCode) {
          iErrorCode = 1;
        }

        let bNoFeedback = 0;
        const sMetadata = testReport.execution?.metadata ? JSON.stringify(testReport.execution.metadata) : null;
        if (!testReport.checker) {
          if (testReport.execution) {
            // test produces an error in the code
            if (testReport.extraChecker) {
              sErrorMsg = testReport.extraChecker.stdout.data;
            } else {
              sErrorMsg = testReport.execution.stderr.data;
            }

            bNoFeedback = testReport.execution?.noFeedback ? 1 : 0;

            await Db.execute('insert ignore into tm_submissions_tests (ID, idSubmission, idTest, iScore, iTimeMs, iMemoryKb, iErrorCode, sErrorMsg, sMetadata, sExpectedOutput, idSubmissionSubtask, bNoFeedback) values (:ID, :idSubmission, :idTest, :iScore, :iTimeMs, :iMemoryKb, :iErrorCode, :sErrorMsg, :sMetadata, :sExpectedOutput, :idSubmissionSubtask, :bNoFeedback);', {
              ID: getRandomId(),
              idSubmission: tokenParams.sTaskName,
              idTest: test.ID,
              iScore: 0,
              iTimeMs: testReport.execution.timeTakenMs,
              iMemoryKb: testReport.execution.memoryUsedKb,
              iErrorCode,
              sExpectedOutput: test.sOutput,
              sErrorMsg,
              sMetadata,
              idSubmissionSubtask: submissionSubtaskId,
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

          await Db.execute('insert ignore into tm_submissions_tests (ID, idSubmission, idTest, iScore, iTimeMs, iMemoryKb, iErrorCode, sOutput, sExpectedOutput, sErrorMsg, sMetadata, sLog, jFiles, idSubmissionSubtask, bNoFeedback) values (:ID, :idSubmission, :idTest, :iScore, :iTimeMs, :iMemoryKb, :iErrorCode, :sOutput, :sExpectedOutput, :sErrorMsg, :sMetadata, :sLog, :jFiles, :idSubmissionSubtask, :bNoFeedback);', {
            ID: getRandomId(),
            idSubmission: tokenParams.sTaskName,
            idTest: test.ID,
            iScore,
            iTimeMs: testReport.execution?.timeTakenMs,
            iMemoryKb: testReport.execution?.memoryUsedKb,
            iErrorCode,
            sOutput,
            sExpectedOutput: test.sOutput,
            sErrorMsg: testReport.execution?.stderr.data,
            sMetadata,
            sLog: testLog,
            jFiles: files,
            idSubmissionSubtask: submissionSubtaskId,
            bNoFeedback,
          });
        }

        if (index in testReportToSubtask && null !== submissionSubtaskId) {
          minPointsSubtask[submissionSubtaskId] = Math.min(minPointsSubtask[submissionSubtaskId], Math.round(iScore * testReportToSubtask[index].iPointsMax / 100));
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

    await Db.execute('UPDATE tm_submissions SET nbTestsPassed = :nbTestsPassed, iScore = :iScore, nbTestsTotal = :nbTestsTotal, bCompilError = :bCompilError, bSuccess = :bSuccess, sCompilMsg = :sCompilMsg, sErrorMsg = :sErrorMsg, sMetadata = :sMetadata, bEvaluated = \'1\' WHERE id = :sName', {
      sName: tokenParams.sTaskName,
      nbTestsPassed,
      iScore,
      nbTestsTotal,
      bCompilError,
      sErrorMsg,
      sCompilMsg,
      sMetadata,
      bSuccess,
    });
  }

  longPollingHandler.fireEvent('evaluation-' + submission.ID);
}
