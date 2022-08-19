import * as Db from "./db";
import {Platform, SourceCode, Task} from "./models";
import {decodePlatformToken, PlatformTokenParameters} from "./tokenization";
import {getRandomId} from "./util";
import {RowDataPacket} from "mysql2";

export interface SubmissionParametersAnswer {
    sourceCode: string,
    language: string,
}

export interface SubmissionParametersUserTest {
    name: string,
    input: string,
    output: string,
}

export interface SubmissionParametersTaskParameters {
    returnUrl: string,
}

export interface SubmissionParameters {
    token: string,
    platform: string,
    answer: SubmissionParametersAnswer,
    answerToken?: string,
    taskId: string,
    userTests: SubmissionParametersUserTest[],
    taskParams: SubmissionParametersTaskParameters,
    sLocale: string,
}

export async function getPlatformTokenParams(token: string, platform: string, taskId: string): Promise<PlatformTokenParameters> {
    if (!platform && process.env.TEST_MODE && process.env.TEST_MODE_PLATFORM_NAME) {
        platform = process.env.TEST_MODE_PLATFORM_NAME;
    }

    const platforms = await Db.execute<Platform[]>("SELECT ID, public_key FROM tm_platforms WHERE name = ?", [platform]);
    if (!platforms.length) {
        throw "Cannot find platform " + platform;
    }

    const platformEntity = platforms[0];
    const platformKey = platformEntity.public_key;

    const params = decodePlatformToken(token, platformKey, platform, taskId, platformEntity);

    if (!params.idUser || (!params.idItem && !params.itemUrl)) {
        console.error("Missing idUser or idItem in token", params);
        throw "Missing idUser or idItem in token";
    }

    params.idPlatform = platformEntity.ID;
    params.idTaskLocal = await getLocalIdTask(params);

    return params;
}

function getIdFromUrl(itemUrl: string) {
    const urlSearchParams = (new URL(itemUrl)).searchParams;
    const params = Object.fromEntries(urlSearchParams.entries());

    return params['taskId'] ? params['taskId'] : null;
}

async function getLocalIdTask(params: PlatformTokenParameters) {
    const idItem = params.idItem || null;
    const itemUrl = params.itemUrl || null;
    if (itemUrl) {
        const id = getIdFromUrl(itemUrl);
        if (!id) {
            throw "Cannot find ID in url " + itemUrl;
        }

        return id;
    }

    const ids: RowDataPacket[] = await Db.execute("SELECT ID FROM tm_tasks WHERE sTextId = ?", [idItem]);
    if (!ids.length) {
        throw "Cannot find task " + idItem;
    }

    return ids[0] as unknown as string;
}

export async function createSubmission(submissionData: SubmissionParameters): Promise<string> {
    if (!process.env.TEST_MODE && (!submissionData.token || !submissionData.platform)) {
        throw "Missing token or platform POST variable";
    }

    if (!submissionData.answer || !submissionData.answer.sourceCode || !submissionData.answer.language) {
        throw "Invalid answer object";
    }

    const params = await getPlatformTokenParams(submissionData.token, submissionData.platform, submissionData.taskId);
    const mode = submissionData.userTests && submissionData.userTests.length ? 'UserTest' : 'Submitted';

    // save source code (with bSubmission = 1)
    const idNewSourceCode = getRandomId();
    const idSubmission = getRandomId();
    const sourceCodeParams = JSON.stringify({
        sLangProg: submissionData.answer.language,
    });

    await Db.execute("insert into tm_source_codes (ID, idUser, idPlatform, idTask, sDate, sParams, sName, sSource, bSubmission) values(:idNewSC, :idUser, :idPlatform, :idTask, NOW(), :sParams, :idSubmission, :sSource, \'1\');", {
        idNewSC: idNewSourceCode,
        idUser: params.idUser,
        idPlatform: params.idPlatform,
        idTask: params.idTaskLocal,
        sParams: sourceCodeParams,
        idSubmission,
        sSource: submissionData.answer.sourceCode
    });

    await Db.execute("insert into tm_submissions (ID, idUser, idPlatform, idTask, sDate, idSourceCode, sMode) values(:idSubmission, :idUser, :idPlatform, :idTask, NOW(), :idSourceCode, :sMode);", {
        idSubmission,
        idUser: params.idUser,
        idPlatform: params.idPlatform,
        idTask: params.idTaskLocal,
        idSourceCode: idNewSourceCode,
        sMode: mode,
    });

    if ('UserTest' === mode) {
        for (let [index, test] of submissionData.userTests.entries()) {
            await Db.execute("insert into tm_tasks_tests (idUser, idPlatform, idTask, sGroupType, sInput, sOutput, sName, iRank, idSubmission) values(:idUser, :idPlatform, :idTask, \'Submission\', :sInput, :sOutput, :sName, :iRank, :idSubmission);", {
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

export async function findSourceCodeById(sourceCodeId: string): Promise<SourceCode> {
    const sourceCodes = await Db.execute<SourceCode[]>("SELECT * FROM tm_source_codes WHERE ID = ?", [sourceCodeId]);
    if (!sourceCodes.length) {
        throw "not found";
    }

    return {...sourceCodes[0]} as SourceCode;
}
