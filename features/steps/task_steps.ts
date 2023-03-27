import {Given, Then, When} from '@cucumber/cucumber';
import * as Db from '../../src/db';
import path from 'path';
import {getRandomId} from '../../src/util';
import {expect} from 'chai';
import {readFile} from 'fs/promises';
import {ServerInjectResponse} from '@hapi/hapi';
import {testServer} from '../support/hooks';

interface TaskStepsContext {
    defaultTaskId: string,
    response: ServerInjectResponse,
}


Given(/^there is a default task in the database$/, async function (this: TaskStepsContext) {
    const taskId = getRandomId();

    await Db.execute(`
        INSERT INTO tm_tasks
            (ID, sTextId, sSupportedLangProg, sAuthor, sAuthorSolution, bShowLimits, bEditorInStatement,
             bUserTests, bChecked, iEvalMode, bUsesLibrary, bUseLatex, iTestsMinSuccessScore, bIsEvaluable,
            sDefaultEditorMode, bTestMode,
             sTaskPath, sRevision, iVersion, bHasSubtasks)
        values (:ID, "FranceIOI/Contests/2018/Algorea_finale/plateau", "python", '', '', 1, 0, 0, 0, 0, 0, 0, 100, 1,
                "normal", 0, "$ROOT_PATH/FranceIOI/Contests/2018/Algorea_finale/plateau", "7156", 2147483647, 1)`, {
        ID: taskId,
    });

    await Db.execute(`
        INSERT INTO tm_tasks_limits
            (ID, idTask, sLangProg, iMaxTime, iMaxMemory, iVersion)
        values (:ID, :idTask, "python", 200, 64000, 2147483647)`, {
        ID: getRandomId(),
        idTask: taskId,
    });

    await Db.execute(`
        INSERT INTO tm_tasks_strings
            (ID, idTask, sLanguage, sTitle, sTranslator, sStatement, iVersion)
        values (:ID, :idTask, "fr", "Plateau", '', "<p>Instructions</p>", 2147483647)`, {
        ID: getRandomId(),
        idTask: taskId,
    });

    const subTaskIds = [...new Array(4)].map(() => getRandomId());

    await Db.execute(`
        INSERT INTO tm_tasks_subtasks
            (ID, idTask, iRank, name, comments, iPointsMax, bActive, iVersion)
        values
            (:ID1, :idTask, 0, "subtask0", "Exemples", 0, 1, 2147483647),
            (:ID2, :idTask, 0, "subtask1", "N <= 25", 20, 1, 2147483647)
        `, {
        ID1: subTaskIds[0],
        ID2: subTaskIds[1],
        idTask: taskId,
    });

    await Db.execute(`
        INSERT INTO tm_tasks_tests
            (idTask, idSubtask, sGroupType, iRank, bActive, sName, sInput, sOutput, iVersion)
        values
            (:idTask, :idSubtask1, "Evaluation", 0, 1, "s1-t1", "15", "10", 2147483647),
            (:idTask, :idSubtask1, "Evaluation", 1, 1, "s1-t2", "16", "20", 2147483647),
            (:idTask, :idSubtask2, "Evaluation", 2, 1, "s2-t1", "10", "15", 2147483647)
        `, {
        idSubtask1: subTaskIds[0],
        idSubtask2: subTaskIds[1],
        idTask: taskId,
    });

    this.defaultTaskId = taskId;
});

When(/^the server receives a (GET|POST) request to "([^"]*)"$/, async function (this: TaskStepsContext, method: string, url: string) {
    this.response = await testServer.inject({
        method,
        url: url.replace(/{defaultTaskId}/g, this.defaultTaskId),
    });
});

Then(/^the server response should include the following object: "([^"]*)"$/, async function (this: TaskStepsContext, fileName: string) {
    expect(this.response.statusCode).to.equal(200);

    const expectedResponse = JSON.parse(await readFile(path.join(__dirname, '..', fileName), "utf8"));
    const payload = JSON.parse(this.response.payload);

    expect(payload.id).to.equal(this.defaultTaskId);
    expect(payload).containSubset(expectedResponse);
});

Then(/^the server should return the status code (\d+)$/, async function (this: TaskStepsContext, errorCode) {
    expect(this.response.statusCode).to.equal(errorCode);
});
