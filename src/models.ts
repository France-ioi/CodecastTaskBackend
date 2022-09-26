import {RowDataPacket} from 'mysql2';

export interface Task extends RowDataPacket {
    ID: string,
    sTextId: string,
    sSupportedLangProg: string,
    sEvalTags: string,
    sAuthor: string,
    sAuthorSolution: string,
    bShowLimits: boolean,
    bEditorInStatement: boolean,
    bUserTests: boolean,
    bChecked: boolean,
    iEvalMode: number,
    bUseLatex: boolean,
    iTestsMinSuccessScore: number,
    bIsEvaluable: boolean,
    sTemplateName: string,
    sScriptAnimation: string,
    sDefaultEditorMode: string,
    sEvalResultOutputScript: string|null,
    bTestMode: boolean,
    sTaskPath: string,
    sRevision: string,
    sAssetsBaseUrl: string|null,
    iVersion: number,
    bHasSubtasks: boolean,
}

export interface TaskLimit extends RowDataPacket {
    ID: string,
    idTask: string,
    sLangProg: string,
    iMaxTime: number,
    iMaxMemory: number,
    iVersion: number,
}

export interface TaskString extends RowDataPacket {
    ID: string,
    idTask: string,
    sLanguage: string,
    sTitle: string,
    sTranslator: string,
    sStatement: string,
    sSolution: string|null,
    iVersion: number,
}

export interface TaskSubtask extends RowDataPacket {
    ID: string,
    idTask: string,
    iRank: number,
    name: string,
    comments: string|null,
    iPointsMax: number,
    bActive: boolean,
    iVersion: number,
}

export interface TaskTest extends RowDataPacket {
    ID: string,
    idTask: string,
    idSubtask: string|null,
    idSubmission: string|null,
    sGroupType: string,
    idUser: string,
    idPlatform: string,
    iRank: number,
    bActive: boolean,
    sName: string,
    sInput: string,
    sOutput: string,
    iVersion: number,
}

export interface Platform extends RowDataPacket {
    ID: string,
    name: string,
    public_key: string,
}

export interface Submission extends RowDataPacket {
    ID: string,
    idUser: string,
    idPlatform: string,
    idTask: string,
    sDate: string,
    idSourceCode: string,
    bManualCorrection: boolean,
    bSuccess: boolean,
    nbTestsTotal: number,
    nbTestsPassed: number,
    iScore: number,
    bCompilError: boolean,
    sCompilMsg: string,
    sErrorMsg: string,
    sFirstUserOutput: string,
    sFirstExpectedOutput: string,
    sManualScoreDiffComment: string,
    bEvaluated: boolean,
    bConfirmed: boolean,
    sMode: string,
    sReturnUrl: string,
    idUserAnswer: string,
    iChecksum: number,
    iVersion: number,
}

export interface SourceCode extends RowDataPacket {
    ID: string,
    idUser: string,
    idPlatform: string,
    idTask: string,
    sDate: string,
    sParams: string,
    sName: string,
    sSource: string,
    bEditable: boolean,
    bSubmission: boolean,
    sType: string,
    bActive: boolean,
    iRank: number,
    iVersion: number,
}
