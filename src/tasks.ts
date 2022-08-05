import * as Db from "./db";
import {TaskLimit, Task, TaskString, TaskSubtask, TaskTest} from "./models";

function normalizeTask(task: Task) {
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
    }
}

function normalizeTaskLimit(taskLimit: TaskLimit) {
    return {
        id: taskLimit.ID,
        taskId: taskLimit.idTask,
        language: taskLimit.sLangProg,
        maxTime: taskLimit.iMaxTime,
        maxMemory: taskLimit.iMaxMemory,
    }
}

function normalizeTaskString(taskString: TaskString) {
    return {
        id: taskString.ID,
        taskId: taskString.idTask,
        language: taskString.sLanguage,
        title: taskString.sTitle,
        statement: taskString.sStatement,
        solution: taskString.sSolution,
    }
}

function normalizeTaskSubtask(taskSubtask: TaskSubtask) {
    return {
        id: taskSubtask.ID,
        taskId: taskSubtask.idTask,
        rank: taskSubtask.iRank,
        name: taskSubtask.name,
        comments: taskSubtask.comments,
        pointsMax: taskSubtask.iPointsMax,
        active: taskSubtask.bActive,
    }
}

function normalizeTaskTest(taskTest: TaskTest) {
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
    }
}

export async function getTask(taskId: string) {
    const tasks = await Db.execute<Task[]>("SELECT * FROM tm_tasks WHERE ID = ?", [taskId]);
    if (!tasks.length) {
        throw "not found";
    }

    const task = {...tasks[0]} as Task;

    const taskLimits = await Db.execute<TaskLimit[]>("SELECT * FROM tm_tasks_limits WHERE idTask = ?", [taskId]);
    const taskStrings = await Db.execute<TaskString[]>("SELECT * FROM tm_tasks_strings WHERE idTask = ?", [taskId]);
    const taskSubtasks = await Db.execute<TaskSubtask[]>("SELECT * FROM tm_tasks_subtasks WHERE idTask = ?", [taskId]);
    const tasksTests = await Db.execute<TaskTest[]>("SELECT * FROM tm_tasks_tests WHERE idTask = ?", [taskId]);

    return {
        ...normalizeTask(task),
        limits: taskLimits.map(normalizeTaskLimit),
        strings: taskStrings.map(normalizeTaskString),
        subTasks: taskSubtasks.map(normalizeTaskSubtask),
        tests: tasksTests.map(normalizeTaskTest),
    }
}
