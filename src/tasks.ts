import * as Db from './db';
import {Task, TaskString, TaskSubtask, TaskTest, TaskLimitModel, SourceCode} from './db_models';
import {extractPlatformTaskTokenData, PlatformTaskTokenData} from "./platform_interface";
import {pipe} from "fp-ts/function";
import * as D from "io-ts/Decoder";
import {normalizeSourceCode, SourceCodeNormalized} from "./submissions";
import appConfig from "./config";

export interface TaskNormalized {
  id: string,
  textId: string,
  supportedLanguages: string,
  author: string,
  showLimits: boolean,
  userTests: boolean,
  isEvaluable: boolean,
  scriptAnimation: string,
  hasSubtasks: boolean,
}

export interface TaskLimitNormalized {
  id: string,
  taskId: string,
  language: string,
  maxTime: number,
  maxMemory: number,
}

export interface TaskStringNormalized {
  id: string,
  taskId: string,
  language: string,
  title: string,
  statement: string,
  solution?: string|null,
}

export interface TaskSubtaskNormalized {
  id: string,
  taskId: string,
  rank: number,
  name: string,
  comments: string|null,
  pointsMax: number,
  active: boolean,
}

export interface TaskTestNormalized {
  id: string,
  taskId: string,
  subtaskId: string|null,
  submissionId: string|null,
  groupType: string,
  userId: string|null,
  platformId: string|null,
  rank: number,
  active: boolean,
  name: string|null,
  input: string,
  output: string,
  clientId: string|null,
}

export interface TaskOutput extends TaskNormalized {
  limits: TaskLimitNormalized[],
  strings: TaskStringNormalized[],
  subTasks: TaskSubtaskNormalized[],
  tests: TaskTestNormalized[],
  sourceCodes: SourceCodeNormalized[],
  solution?: string,
}

export const taskQueryDecoder = pipe(
  D.partial({
    token: D.nullable(D.string),
    platform: D.nullable(D.string),
  })
);
export type TaskQueryParameters = D.TypeOf<typeof taskQueryDecoder>;

function normalizeTask(task: Task): TaskNormalized {
  return {
    id: task.ID,
    textId: task.sTextId,
    supportedLanguages: task.sSupportedLangProg,
    author: task.sAuthor,
    showLimits: !!task.bShowLimits,
    userTests: !!task.bUserTests,
    isEvaluable: !!task.bIsEvaluable,
    scriptAnimation: task.sScriptAnimation,
    hasSubtasks: !!task.bHasSubtasks,
  };
}

function normalizeTaskLimit(taskLimit: TaskLimitModel): TaskLimitNormalized {
  return {
    id: taskLimit.ID,
    taskId: taskLimit.idTask,
    language: taskLimit.sLangProg,
    maxTime: taskLimit.iMaxTime,
    maxMemory: taskLimit.iMaxMemory,
  };
}

function normalizeTaskString(taskString: TaskString, accessSolution: boolean): TaskStringNormalized {
  return {
    id: taskString.ID,
    taskId: taskString.idTask,
    language: taskString.sLanguage,
    title: taskString.sTitle,
    statement: taskString.sStatement,
    ...(accessSolution ? {solution: taskString.sSolution} : {}),
  };
}

function normalizeTaskSubtask(taskSubtask: TaskSubtask): TaskSubtaskNormalized {
  return {
    id: taskSubtask.ID,
    taskId: taskSubtask.idTask,
    rank: taskSubtask.iRank,
    name: taskSubtask.name,
    comments: taskSubtask.comments,
    pointsMax: taskSubtask.iPointsMax,
    active: !!taskSubtask.bActive,
  };
}

export function normalizeTaskTest(taskTest: TaskTest): TaskTestNormalized {
  return {
    id: taskTest.ID,
    taskId: taskTest.idTask,
    subtaskId: taskTest.idSubtask,
    submissionId: taskTest.idSubmission,
    groupType: taskTest.sGroupType,
    userId: taskTest.idUser,
    platformId: taskTest.idPlatform,
    rank: taskTest.iRank,
    active: !!taskTest.bActive,
    name: 'User' === taskTest.sGroupType ? taskTest.sName : null, // Do not return test name to the client to avoid giving more information to it, asked by Mathias
    input: taskTest.sInput,
    output: taskTest.sOutput,
    clientId: taskTest.sClientId,
  };
}

export async function findTaskById(taskId: string): Promise<Task|null> {
  return await Db.querySingleResult<Task>('SELECT * FROM tm_tasks WHERE ID = ?', [taskId]);
}

export async function getTask(taskId: string, taskParameters: TaskQueryParameters): Promise<TaskOutput|null> {
  const task = await findTaskById(taskId);
  if (null === task) {
    return null;
  }

  const taskLimits = await Db.execute<TaskLimitModel[]>('SELECT * FROM tm_tasks_limits WHERE idTask = ?', [taskId]);
  const taskStrings = await Db.execute<TaskString[]>('SELECT * FROM tm_tasks_strings WHERE idTask = ?', [taskId]);
  const taskSubtasks = await Db.execute<TaskSubtask[]>('SELECT * FROM tm_tasks_subtasks WHERE idTask = ?', [taskId]);
  const taskTests = await Db.execute<TaskTest[]>('SELECT * FROM tm_tasks_tests WHERE idTask = ?', [taskId]);

  let accessSolution = false;
  let taskSourceCodes: SourceCode[]|null = null;
  let taskTokenData: PlatformTaskTokenData|null = null;
  if (taskParameters?.token) {
    taskTokenData = await extractPlatformTaskTokenData(taskParameters.token, taskParameters.platform, taskId);
    if (taskTokenData.payload.bAccessSolutions) {
      accessSolution = true;
    }
    if (taskTokenData.payload) {
      taskSourceCodes = await Db.execute<SourceCode[]>(
        'SELECT * FROM tm_source_codes WHERE idTask = ? AND ((idUser = ? and idPlatform = ?) OR  `sType` = \'Task\' OR `sType` = \'Solution\')',
        [
          taskId,
          taskTokenData.payload.idUser,
          taskTokenData.platform.ID,
        ]
      );
    }
  } else if (appConfig.testMode.accessSolutions) {
    accessSolution = true;
  }

  if (null === taskSourceCodes) {
    taskSourceCodes = await Db.execute<SourceCode[]>('SELECT * FROM tm_source_codes WHERE idTask = ? AND (`sType` = \'Task\' OR `sType` = \'Solution\')', [taskId]);
  }

  return {
    ...normalizeTask(task),
    limits: taskLimits.map(normalizeTaskLimit),
    strings: taskStrings.map(taskString => normalizeTaskString(taskString, accessSolution)),
    subTasks: taskSubtasks.map(normalizeTaskSubtask),
    tests: taskTests.map(normalizeTaskTest),
    sourceCodes: taskSourceCodes.map(normalizeSourceCode),
  };
}
