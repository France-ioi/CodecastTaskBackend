import {SubmissionMode} from './submissions';

export interface Task {
    ID: string,
    sTextId: string,
    sSupportedLangProg: string,
    sEvalTags: string,
    sAuthor: string,
    sAuthorSolution: string,
    bShowLimits: number,
    bEditorInStatement: number,
    bUserTests: number,
    bChecked: number,
    iEvalMode: number,
    bUseLatex: number,
    iTestsMinSuccessScore: number,
    bIsEvaluable: number,
    sTemplateName: string,
    sScriptAnimation: string,
    sDefaultEditorMode: string,
    sEvalResultOutputScript: string|null,
    bTestMode: number,
    sTaskPath: string,
    sRevision: string,
    sAssetsBaseUrl: string|null,
    iVersion: number,
    bHasSubtasks: number,
}

export interface TaskLimit {
  iMaxTime: number,
  iMaxMemory: number,
}

export interface TaskLimitModel extends TaskLimit {
    ID: string,
    idTask: string,
    sLangProg: string,
    iVersion: number,
}

export interface TaskString {
    ID: string,
    idTask: string,
    sLanguage: string,
    sTitle: string,
    sTranslator: string,
    sStatement: string,
    sSolution: string|null,
    iVersion: number,
}

export interface TaskSubtask {
    ID: string,
    idTask: string,
    iRank: number,
    name: string,
    comments: string|null,
    iPointsMax: number,
    bActive: number,
    iVersion: number,
}

export interface TaskTest {
    ID: string,
    idTask: string,
    idSubtask: string|null,
    idSubmission: string|null,
    sGroupType: string,
    idUser: string|null,
    idPlatform: string|null,
    iRank: number,
    bActive: number,
    sName: string,
    sInput: string,
    sOutput: string,
    iVersion: number,
}

export interface Platform {
    ID: string,
    name: string,
    public_key: string,
}

export interface Submission {
    ID: string,
    idUser: string,
    idPlatform: string,
    idTask: string,
    sDate: string,
    idSourceCode: string,
    bManualCorrection: number,
    bSuccess: number,
    nbTestsTotal: number,
    nbTestsPassed: number,
    iScore: number,
    bCompilError: number,
    sCompilMsg: string|null,
    sErrorMsg: string|null,
    sManualScoreDiffComment: string|null,
    bEvaluated: number,
    bConfirmed: number,
    sMode: SubmissionMode,
    sReturnUrl: string|null,
    idUserAnswer: string|null,
    iChecksum: number,
    iVersion: number,
}

export interface SubmissionSubtask {
  ID: string,
  bSuccess: number,
  iScore: number,
  idSubtask: string,
  idSubmission: string,
  iVersion: number,
}

export interface SubmissionTest {
  ID: string,
  idSubmission: string,
  idTest: string,
  iScore: number,
  iTimeMs: number,
  iMemoryKb: number,
  iErrorCode: number,
  sOutput: string|null,
  sExpectedOutput: string|null,
  sErrorMsg: string|null,
  sLog: string|null,
  bNoFeedback: number,
  jFiles: string|null,
  iVersion: number,
  idSubmissionSubtask: string|null,
}

export interface SourceCode {
    ID: string,
    idUser: string,
    idPlatform: string,
    idTask: string,
    sDate: string,
    sParams: string,
    sName: string,
    sSource: string,
    bEditable: number,
    bSubmission: number,
    sType: string,
    bActive: number,
    iRank: number,
    iVersion: number,
}
