Feature: Post submission

  Background: Create task
    Given the database has the following table "tm_tasks":
      | ID   | sTextId                                        | sSupportedLangProg  | sAuthor | sAuthorSolution | bShowLimits | bEditorInStatement | bUserTests | bChecked | iEvalMode | bUsesLibrary | bUseLatex | iTestsMinSuccessScore | bIsEvaluable | sDefaultEditorMode | bTestMode | sTaskPath                                                 | sRevision | iVersion   | bHasSubtasks |
      | 1000 | FranceIOI/Contests/2018/Algorea_finale/plateau | python              |         |                 | 1           | 0                  | 0          | 0        | 0         | 0            | 0         | 100                   | 1            | normal             | 0         | $ROOT_PATH/FranceIOI/Contests/2018/Algorea_finale/plateau | 7156      | 2147483647 | 1            |
    And the database has the following table "tm_tasks_limits":
      | ID   | idTask    | sLangProg  | iMaxTime | iMaxMemory | iVersion   |
      | 2000 | 1000      | python     | 200      | 64000      | 2147483647 |
    And the database has the following table "tm_tasks_strings":
      | ID   | idTask    | sLanguage  | sTitle  | sTranslator | sStatement          | iVersion   |
      | 3000 | 1000      | fr         | Plateau |             | <p>Instructions</p> | 2147483647 |
    And the database has the following table "tm_tasks_subtasks":
      | ID   | idTask    | iRank  | name     | comments | iPointsMax | bActive | iVersion   |
      | 4000 | 1000      | 0      | subtask0 | Exemples | 0          | 1       | 2147483647 |
      | 4001 | 1000      | 0      | subtask1 | N <= 25  | 20         | 1       | 2147483647 |
    And the database has the following table "tm_tasks_tests":
      | ID   | idTask    | idSubtask  | sGroupType     | iRank | bActive | sName | sInput | sOutput | iVersion   |
      | 5000 | 1000      | 4000       | Evaluation     | 0     | 1       | s1-t1 | 16     | 20      | 2147483647 |
      | 5001 | 1000      | 4000       | Evaluation     | 1     | 1       | s1-t2 | 10     | 15      | 2147483647 |
      | 5002 | 1000      | 4001       | Evaluation     | 2     | 1       | s2-t1 | 15     | 10      | 2147483647 |
    And the database has the following table "tm_platforms":
      | ID   | name                   | public_key |
      | 1    | codecast-dev-sebastien |            |
    And I seed the ID generator to 100
    And I mock the graderqueue

  Scenario: Post submission
    When I send a POST request to "/submissions" with the following payload:
      """
      {
        "token": null,
        "answerToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpdGVtVXJsIjoiaHR0cDovL2x2aC5tZTo4MDAxL25leHQvdGFzaz90YXNrSUQ9bnVsbCZ2ZXJzaW9uPXVuZGVmaW5lZCIsInJhbmRvbVNlZWQiOiI2Iiwic0hpbnRzUmVxdWVzdGVkIjoiW10iLCJzQW5zd2VyIjoiXCJcXFwiYWFhXFxcIlwiIiwiaWF0IjoxNjgyMzQxMTQxfQ.vNA9EgZkGboNS7aGzFJRo60JdrQX-APIOHnf313ESzA",
        "answer": {
          "language": "python",
          "sourceCode": "print('ici')"
        },
        "userTests": [],
        "sLocale": "fr",
        "platform": null,
        "taskId": "1000",
        "taskParams": {
          "minScore": 0,
          "maxScore": 100,
          "noScore": 0,
          "readOnly": false,
          "randomSeed": "",
          "returnUrl": ""
        }
      }
      """
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "submissionId": "101",
        "success": true
      }
      """
    And the table "tm_submissions" should be:
      | ID   | idUser    | idPlatform  | idTask     | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | bConfirmed | sMode     | iChecksum | iVersion   |
      | 101  | 1         | 1           | 1000       | 100          | 0                 | 0        | 0            | 0             | 0      | 0            | 0          | 0          | Submitted | 0         | 2147483647 |
    And the table "tm_source_codes" should be:
      | ID   | idUser    | idPlatform  | idTask     | sParams                | sName | sSource      | bEditable | bSubmission | sType | bActive | iRank | iVersion   |
      | 100  | 1         | 1           | 1000       | {"sLangProg":"python"} | 101   | print('ici') | 0         | 1           | User  | 0       | 0     | 2147483647 |
    And the grader queue should have received the following request:
    """
    {
      "request": "sendjob",
      "priority": 1,
      "taskrevision": "7156",
      "tags": "",
      "jobname": "101",
      "jobdata": "{\"taskPath\":\"$ROOT_PATH/FranceIOI/Contests/2018/Algorea_finale/plateau\",\"extraParams\":{\"solutionFilename\":\"101.py\",\"solutionContent\":\"print('ici')\",\"solutionLanguage\":\"python3\",\"solutionDependencies\":\"@defaultDependencies-python3\",\"solutionFilterTests\":\"@defaultFilterTests-python3\",\"solutionId\":\"sol0-101.py\",\"solutionExecId\":\"exec0-101.py\",\"defaultSolutionCompParams\":{\"memoryLimitKb\":131072,\"timeLimitMs\":10000,\"stdoutTruncateKb\":-1,\"stderrTruncateKb\":-1,\"useCache\":true,\"getFiles\":[]},\"defaultSolutionExecParams\":{\"memoryLimitKb\":64000,\"timeLimitMs\":200,\"stdoutTruncateKb\":-1,\"stderrTruncateKb\":-1,\"useCache\":true,\"getFiles\":[]}},\"options\":{\"locale\":\"fr\"}}",
      "jobusertaskid": "1000-1-1",
      "debugPassword": "test"
    }
    """

  Scenario: Post submission on unknown task
    When I send a POST request to "/submissions" with the following payload:
      """
      {
        "token": null,
        "answerToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpdGVtVXJsIjoiaHR0cDovL2x2aC5tZTo4MDAxL25leHQvdGFzaz90YXNrSUQ9bnVsbCZ2ZXJzaW9uPXVuZGVmaW5lZCIsInJhbmRvbVNlZWQiOiI2Iiwic0hpbnRzUmVxdWVzdGVkIjoiW10iLCJzQW5zd2VyIjoiXCJcXFwiYWFhXFxcIlwiIiwiaWF0IjoxNjgyMzQxMTQxfQ.vNA9EgZkGboNS7aGzFJRo60JdrQX-APIOHnf313ESzA",
        "answer": {
          "language": "python",
          "sourceCode": "print('ici')"
        },
        "userTests": [],
        "sLocale": "fr",
        "platform": null,
        "taskId": "1001",
        "taskParams": {
          "minScore": 0,
          "maxScore": 100,
          "noScore": 0,
          "readOnly": false,
          "randomSeed": "",
          "returnUrl": ""
        }
      }
      """
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: Invalid task id: 1001"
      }
      """
