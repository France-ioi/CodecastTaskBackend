import * as Db from './db';
import {Task, TaskString, TaskSubtask, TaskTest, TaskLimitModel} from './db_models';

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
  solution: string|null,
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
  userId: string,
  platformId: string,
  rank: number,
  active: boolean,
  name: string,
  input: string,
  output: string,
}

export interface TaskOutput extends TaskNormalized {
  limits: TaskLimitNormalized[],
  strings: TaskStringNormalized[],
  subTasks: TaskSubtaskNormalized[],
  tests: TaskTestNormalized[],
}

function normalizeTask(task: Task): TaskNormalized {
  return {
    id: task.ID,
    textId: task.sTextId,
    supportedLanguages: task.sSupportedLangProg,
    author: task.sAuthor,
    showLimits: task.bShowLimits,
    userTests: task.bUserTests,
    isEvaluable: task.bIsEvaluable,
    scriptAnimation: task.sScriptAnimation,
    hasSubtasks: task.bHasSubtasks,
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

function normalizeTaskString(taskString: TaskString): TaskStringNormalized {
  return {
    id: taskString.ID,
    taskId: taskString.idTask,
    language: taskString.sLanguage,
    title: taskString.sTitle,
    statement: taskString.sStatement,
    solution: taskString.sSolution,
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
    active: taskSubtask.bActive,
  };
}

function normalizeTaskTest(taskTest: TaskTest): TaskTestNormalized {
  return {
    id: taskTest.ID,
    taskId: taskTest.idTask,
    subtaskId: taskTest.idSubtask,
    submissionId: taskTest.idSubmission,
    groupType: taskTest.sGroupType,
    userId: taskTest.idUser,
    platformId: taskTest.idPlatform,
    rank: taskTest.iRank,
    active: taskTest.bActive,
    name: taskTest.sName,
    input: taskTest.sInput,
    output: taskTest.sOutput,
  };
}

export async function findTaskById(taskId: string): Promise<Task|null> {
  return await Db.querySingleResult<Task>('SELECT * FROM tm_tasks WHERE ID = ?', [taskId]);
}

export async function getTask(taskId: string): Promise<TaskOutput|null> {
  const task = await findTaskById(taskId);
  if (null === task) {
    return null;
  }

  const taskLimits = await Db.execute<TaskLimitModel[]>('SELECT * FROM tm_tasks_limits WHERE idTask = ?', [taskId]);
  const taskStrings = await Db.execute<TaskString[]>('SELECT * FROM tm_tasks_strings WHERE idTask = ?', [taskId]);
  const taskSubtasks = await Db.execute<TaskSubtask[]>('SELECT * FROM tm_tasks_subtasks WHERE idTask = ?', [taskId]);
  const tasksTests = await Db.execute<TaskTest[]>('SELECT * FROM tm_tasks_tests WHERE idTask = ?', [taskId]);

  return {
    ...normalizeTask(task),
    limits: taskLimits.map(normalizeTaskLimit),
    strings: taskStrings.map(normalizeTaskString),
    subTasks: taskSubtasks.map(normalizeTaskSubtask),
    tests: tasksTests.map(normalizeTaskTest),
  };
}
