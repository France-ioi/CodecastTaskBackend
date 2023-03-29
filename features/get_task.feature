Feature: Get task

  Scenario: Get task by id
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
    When I send a GET request to "/tasks/1000"
    Then the response status code should be 200
    And the response body should be: "get_task_response.json"

  Scenario: Get unknown task
    When I send a GET request to "/tasks/999999"
    Then the response status code should be 404
