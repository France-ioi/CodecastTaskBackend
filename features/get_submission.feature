Feature: Get submission

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
      | ID   | name          | public_key | api_url |
      | 1    | codecast-test | -----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt8dBg+ojFTrgFeDxoGqqBSQkW/BDSl/H+qzpIpZTCj4mw7zyrIeV7zaaPuA/8g8WVPDjliuVxLwOnX6p8bT0ZEgsyo4/nql2VEI1cLBqSowQ3VoICqeRYHqgv+8g/B4mFxvRRpNNWiM9aE80KtjXBesi7GjULjg6Jnpqfn1UAGrx4AlnbuabH50/xQoQMWLHSpSVhnpEV5XrUPvzHGbkW51/HRRMEF9Fj5SSPs8vQPbA5ZO8H7NgHwN+8fyNuyVtm9DwY9QZVp2mYlbLlV/+y8xrd5TKf/aGyMjVr3du5YwfosrlrnTAJ+DgoxuZRw77DKaiATxSpEiQRH/C208mOwIDAQAB -----END PUBLIC KEY----- | https://mockapi.com |
    And "taskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "idUserAnswer": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000",
        "nbHintsGiven": "0"
      }
      """

  Scenario: Get non-evaluated submission by id
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | bConfirmed | sMode     | idUserAnswer | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 0          | 0          | Submitted | 1            | 0         | 2147483647 |
    And the database has the following table "tm_source_codes":
      | ID   | idUser | idPlatform | idTask | sDate      | sParams                | sName              | sSource      | bEditable | bSubmission | sType | bActive | iRank | iVersion   |
      | 7001 | 1      | 1          | 1000   | 2023-04-03 | {"sLangProg":"python"} | 485380303499640413 | print("ici") | 0         | 1           | User  | 0       | 0     | 2147483647 |
    When I send a GET request to "/submissions/6000?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "id": "6000",
        "success": false,
        "totalTestsCount": 0,
        "passedTestsCount": 0,
        "score": 0,
        "compilationError": false,
        "compilationMessage": null,
        "date": "2023-04-03T00:00:00.000Z",
        "errorMessage": null,
        "evaluated": false,
        "confirmed": false,
        "manualCorrection": false,
        "manualScoreDiffComment": null,
        "metadata": null,
        "sourceCode": {
           "id": "7001",
           "name": "485380303499640413",
           "source": "print(\"ici\")",
           "type": "User",
           "params": {
             "sLangProg": "python"
           },
           "rank": 0,
           "active": false,
           "editable": false
        },
        "mode": "Submitted"
      }
      """

  Scenario: Get evaluated submission by id
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | sMetadata        | bConfirmed | sMode     | idUserAnswer | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 1          | {"errorline": 5} | 0          | Submitted | 1            | 0         | 2147483647 |
    And the database has the following table "tm_submissions_subtasks":
      | ID   | bSuccess | iScore | idSubtask | idSubmission | iVersion   |
      | 7000 | 0        | 50     | 4000      | 6000         | 2147483647 |
      | 7001 | 1        | 100    | 4001      | 6000         | 2147483647 |
    And the database has the following table "tm_submissions_tests":
      | ID   | idSubmission | idTest | iScore | iTimeMs | iMemoryKb | iErrorCode | sOutput | sErrorMsg | sMetadata        | sLog   | bNoFeedback | iVersion   | idSubmissionSubtask |
      | 8000 | 6000         | 5000   | 100     | 5       | 22       | 0          |         |           | {"errorline": 4} |        | 1           | 2147483647 | 7000                |
      | 8001 | 6000         | 5001   | 0       | 2       | 25       | 1          |         | Erreur    |                  |        | 1           | 2147483647 | 7000                |
      | 8002 | 6000         | 5002   | 100     | 3       | 26       | 0          |         |           |                  |        | 1           | 2147483647 | 7001                |
    And the database has the following table "tm_source_codes":
      | ID   | idUser | idPlatform | idTask | sDate      | sParams                | sName              | sSource      | bEditable | bSubmission | sType | bActive | iRank | iVersion   |
      | 7001 | 1      | 1          | 1000   | 2023-04-03 | {"sLangProg":"python"} | 485380303499640413 | print("ici") | 0         | 1           | User  | 0       | 0     | 2147483647 |
    When I send a GET request to "/submissions/6000?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body, after decoding "scoreToken", should be the following JSON:
      """
      {
        "id": "6000",
        "success": false,
        "totalTestsCount": 0,
        "passedTestsCount": 0,
        "score": 0,
        "scoreToken": {
          "date": "{{currentDateTokenFormat}}",
          "idItem": "1000",
          "idUser": "1",
          "idUserAnswer": "1",
          "sAnswer": "{\"idSubmission\":\"6000\",\"langProg\":\"python\",\"sourceCode\":\"print(\\\"ici\\\")\"}",
          "score": "0"
        },
        "compilationError": false,
        "compilationMessage": null,
        "date": "2023-04-03T00:00:00.000Z",
        "errorMessage": null,
        "evaluated": true,
        "confirmed": false,
        "manualCorrection": false,
        "manualScoreDiffComment": null,
        "metadata": {
          "errorline": 5
        },
        "mode": "Submitted",
        "sourceCode": {
           "id": "7001",
           "name": "485380303499640413",
           "source": "print(\"ici\")",
           "type": "User",
           "params": {
             "sLangProg": "python"
           },
           "rank": 0,
           "active": false,
           "editable": false
        },
        "subTasks": [
          {
            "id": "7000",
            "success": false,
            "score": 50,
            "subtaskId": "4000"
          },
          {
            "id": "7001",
            "success": true,
            "score": 100,
            "subtaskId": "4001"
          }
        ],
        "tests": [
          {
            "id": "8000",
            "testId": "5000",
            "score": 100,
            "timeMs": 5,
            "memoryKb": 22,
            "errorCode": 0,
            "output": "",
            "expectedOutput": null,
            "errorMessage": "",
            "metadata": {
              "errorline": 4
            },
            "log": "",
            "noFeedback": true,
            "files": null,
            "submissionSubtaskId": "7000"
          },
          {
            "id": "8001",
            "testId": "5001",
            "score": 0,
            "timeMs": 2,
            "memoryKb": 25,
            "errorCode": 1,
            "output": "",
            "expectedOutput": null,
            "errorMessage": "Erreur",
            "metadata": null,
            "log": "",
            "noFeedback": true,
            "files": null,
            "submissionSubtaskId": "7000"
          },
          {
            "id": "8002",
            "testId": "5002",
            "score": 100,
            "timeMs": 3,
            "memoryKb": 26,
            "errorCode": 0,
            "output": "",
            "expectedOutput": null,
            "errorMessage": "",
            "metadata": null,
            "log": "",
            "noFeedback": true,
            "files": null,
            "submissionSubtaskId": "7001"
          }
        ]
      }
      """

  Scenario: Get evaluated submission by id with tests
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | sMetadata        | bConfirmed | sMode     | idUserAnswer | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 1          | {"errorline": 5} | 0          | Submitted | 1            | 0         | 2147483647 |
    And the database has the following table "tm_submissions_subtasks":
      | ID   | bSuccess | iScore | idSubtask | idSubmission | iVersion   |
      | 7000 | 0        | 50     | 4000      | 6000         | 2147483647 |
      | 7001 | 1        | 100    | 4001      | 6000         | 2147483647 |
    And the database has the following table "tm_submissions_tests":
      | ID   | idSubmission | idTest | iScore | iTimeMs | iMemoryKb | iErrorCode | sOutput | sErrorMsg | sMetadata        | sLog   | bNoFeedback | iVersion   | idSubmissionSubtask |
      | 8000 | 6000         | 5000   | 100     | 5       | 22       | 0          |         |           | {"errorline": 4} |        | 1           | 2147483647 | 7000                |
      | 8001 | 6000         | 5001   | 0       | 2       | 25       | 1          |         | Erreur    |                  |        | 1           | 2147483647 | 7000                |
      | 8002 | 6000         | 5002   | 100     | 3       | 26       | 0          |         |           |                  |        | 1           | 2147483647 | 7001                |
    And the database has the following table "tm_source_codes":
      | ID   | idUser | idPlatform | idTask | sDate      | sParams                | sName              | sSource      | bEditable | bSubmission | sType | bActive | iRank | iVersion   |
      | 7001 | 1      | 1          | 1000   | 2023-04-03 | {"sLangProg":"python"} | 485380303499640413 | print("ici") | 0         | 1           | User  | 0       | 0     | 2147483647 |
    When I send a GET request to "/submissions/6000?token={{taskToken}}&platform=codecast-test&withTests"
    Then the response status code should be 200
    And the response body, after decoding "scoreToken", should be the following JSON:
      """
      {
        "id": "6000",
        "success": false,
        "totalTestsCount": 0,
        "passedTestsCount": 0,
        "score": 0,
        "scoreToken": {
          "date": "{{currentDateTokenFormat}}",
          "idItem": "1000",
          "idUser": "1",
          "idUserAnswer": "1",
          "sAnswer": "{\"idSubmission\":\"6000\",\"langProg\":\"python\",\"sourceCode\":\"print(\\\"ici\\\")\"}",
          "score": "0"
        },
        "compilationError": false,
        "compilationMessage": null,
        "date": "2023-04-03T00:00:00.000Z",
        "errorMessage": null,
        "evaluated": true,
        "confirmed": false,
        "manualCorrection": false,
        "manualScoreDiffComment": null,
        "metadata": {
          "errorline": 5
        },
        "mode": "Submitted",
        "sourceCode": {
           "id": "7001",
           "name": "485380303499640413",
           "source": "print(\"ici\")",
           "type": "User",
           "params": {
             "sLangProg": "python"
           },
           "rank": 0,
           "active": false,
           "editable": false
        },
        "subTasks": [
          {
            "id": "7000",
            "success": false,
            "score": 50,
            "subtaskId": "4000"
          },
          {
            "id": "7001",
            "success": true,
            "score": 100,
            "subtaskId": "4001"
          }
        ],
        "tests": [
          {
            "id": "8000",
            "testId": "5000",
            "score": 100,
            "timeMs": 5,
            "memoryKb": 22,
            "errorCode": 0,
            "output": "",
            "expectedOutput": null,
            "errorMessage": "",
            "metadata": {
              "errorline": 4
            },
            "log": "",
            "noFeedback": true,
            "files": null,
            "submissionSubtaskId": "7000",
            "test": {
              "id": "5000",
              "submissionId": null,
              "groupType": "Evaluation",
              "userId": null,
              "platformId": null,
              "rank": 0,
              "active": true,
              "name": null,
              "input": "16",
              "output": "20",
              "subtaskId": "4000",
              "taskId": "1000",
              "clientId": null
            }
          },
          {
            "id": "8001",
            "testId": "5001",
            "score": 0,
            "timeMs": 2,
            "memoryKb": 25,
            "errorCode": 1,
            "output": "",
            "expectedOutput": null,
            "errorMessage": "Erreur",
            "metadata": null,
            "log": "",
            "noFeedback": true,
            "files": null,
            "submissionSubtaskId": "7000",
            "test": {
              "id": "5001",
              "submissionId": null,
              "groupType": "Evaluation",
              "userId": null,
              "platformId": null,
              "rank": 1,
              "active": true,
              "name": null,
              "input": "10",
              "output": "15",
              "subtaskId": "4000",
              "taskId": "1000",
              "clientId": null
            }
          },
          {
            "id": "8002",
            "testId": "5002",
            "score": 100,
            "timeMs": 3,
            "memoryKb": 26,
            "errorCode": 0,
            "output": "",
            "expectedOutput": null,
            "errorMessage": "",
            "metadata": null,
            "log": "",
            "noFeedback": true,
            "files": null,
            "submissionSubtaskId": "7001",
            "test": {
              "id": "5002",
              "submissionId": null,
              "groupType": "Evaluation",
              "userId": null,
              "platformId": null,
              "rank": 2,
              "active": true,
              "name": null,
              "input": "15",
              "output": "10",
              "subtaskId": "4001",
              "taskId": "1000",
              "clientId": null
            }
          }
        ]
      }
      """

  Scenario: Get evaluating submission by id using longPolling
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | bConfirmed | sMode     | idUserAnswer | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 0          | 0          | Submitted | 1            | 0         | 2147483647 |
    And the database has the following table "tm_submissions_subtasks":
      | ID   | bSuccess | iScore | idSubtask | idSubmission | iVersion   |
      | 7000 | 0        | 50     | 4000      | 6000         | 2147483647 |
      | 7001 | 1        | 100    | 4001      | 6000         | 2147483647 |
    And the database has the following table "tm_submissions_tests":
      | ID   | idSubmission | idTest | iScore | iTimeMs | iMemoryKb | iErrorCode | sOutput | sErrorMsg | sLog   | bNoFeedback | iVersion   | idSubmissionSubtask |
      | 8000 | 6000         | 5000   | 100     | 5       | 22       | 0          |         |           |        | 1           | 2147483647 | 7000                |
      | 8001 | 6000         | 5001   | 0       | 2       | 25       | 1          |         | Erreur    |        | 1           | 2147483647 | 7000                |
      | 8002 | 6000         | 5002   | 100     | 3       | 26       | 0          |         |           |        | 1           | 2147483647 | 7001                |
    And the database has the following table "tm_source_codes":
      | ID   | idUser | idPlatform | idTask | sDate      | sParams                | sName              | sSource      | bEditable | bSubmission | sType | bActive | iRank | iVersion   |
      | 7001 | 1      | 1          | 1000   | 2023-04-03 | {"sLangProg":"python"} | 485380303499640413 | print("ici") | 0         | 1           | User  | 0       | 0     | 2147483647 |
    When I asynchronously send a GET request to "/submissions/6000?token={{taskToken}}&platform=codecast-test&longPolling"
    And I wait 10ms
    Then the server must not have returned a response
    When I fire the event "evaluation-6000" to the longPolling handler
    Then the server must have returned a response within 1000ms
    And the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "id": "6000",
        "success": false,
        "totalTestsCount": 0,
        "passedTestsCount": 0,
        "score": 0,
        "compilationError": false,
        "compilationMessage": null,
        "date": "2023-04-03T00:00:00.000Z",
        "errorMessage": null,
        "evaluated": false,
        "confirmed": false,
        "manualCorrection": false,
        "manualScoreDiffComment": null,
        "metadata": null,
        "mode": "Submitted",
        "sourceCode": {
           "id": "7001",
           "name": "485380303499640413",
           "source": "print(\"ici\")",
           "type": "User",
           "params": {
             "sLangProg": "python"
           },
           "rank": 0,
           "active": false,
           "editable": false
        }
      }
      """

  Scenario: Get unknown submission
    When I send a GET request to "/submissions/999999?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 404

  Scenario: Get submission without token
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | sMetadata        | bConfirmed | sMode     | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 1          | {"errorline": 5} | 0          | Submitted | 0         | 2147483647 |
    When I send a GET request to "/submissions/6000"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: Missing token or platform POST variable"
      }
      """

  Scenario: Get submission with token from another user
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | sMetadata        | bConfirmed | sMode     | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 1          | {"errorline": 5} | 0          | Submitted | 0         | 2147483647 |
    And "fakeTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "999999",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000",
        "nbHintsGiven": "0"
      }
      """
    When I send a GET request to "/submissions/6000?token={{fakeTaskToken}}&platform=codecast-test"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: User id mismatch between submission data and provided user id from the token: 999999"
      }
      """

  Scenario: Get submission with token from another task
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | sMetadata        | bConfirmed | sMode     | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 1          | {"errorline": 5} | 0          | Submitted | 0         | 2147483647 |
    And "fakeTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=999999",
        "nbHintsGiven": "0"
      }
      """
    When I send a GET request to "/submissions/6000?token={{fakeTaskToken}}&platform=codecast-test"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: Task id mismatch between submission data and provided task id from the token: 999999"
      }
      """

  Scenario: Get submission with token from another platform
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | sMetadata        | bConfirmed | sMode     | iChecksum | iVersion   |
      | 6000 | 1      | 999999     | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 1          | {"errorline": 5} | 0          | Submitted | 0         | 2147483647 |
    And "fakeTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000",
        "nbHintsGiven": "0"
      }
      """
    When I send a GET request to "/submissions/6000?token={{fakeTaskToken}}&platform=codecast-test"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: Platform id mismatch between submission data and provided platform from the token: codecast-test"
      }
      """

  Scenario: Get submission with token from another idUserAnswer
    Given the database has the following table "tm_submissions":
      | ID   | idUser | idPlatform | idTask | sDate      | idSourceCode | bManualCorrection | bSuccess | nbTestsTotal | nbTestsPassed | iScore | bCompilError | bEvaluated | sMetadata        | bConfirmed | sMode     | idUserAnswer | iChecksum | iVersion   |
      | 6000 | 1      | 1          | 1000   | 2023-04-03 | 7001         | 0                 | 0        | 0            | 0             | 0      | 0            | 1          | {"errorline": 5} | 0          | Submitted | 1            | 0         | 2147483647 |
    And "fakeTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000",
        "idUserAnswer": "999999",
        "nbHintsGiven": "0"
      }
      """
    When I send a GET request to "/submissions/6000?token={{fakeTaskToken}}&platform=codecast-test"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: User answer id mismatch between submission data and provided idUserAnswer from the token: 999999"
      }
      """