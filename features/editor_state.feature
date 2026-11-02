Feature: Save editor state

  Background: Create task
    Given the database has the following table "tm_tasks":
      | ID   | sTextId                                        | sSupportedLangProg  | sAuthor | sAuthorSolution | bShowLimits | bEditorInStatement | bUserTests | bChecked | iEvalMode | bUsesLibrary | bUseLatex | iTestsMinSuccessScore | bIsEvaluable | sDefaultEditorMode | bTestMode | sTaskPath                                                 | sRevision | iVersion   | bHasSubtasks |
      | 1000 | FranceIOI/Contests/2018/Algorea_finale/plateau | python              |         |                 | 1           | 0                  | 1          | 0        | 0         | 0            | 0         | 100                   | 1            | normal             | 0         | $ROOT_PATH/FranceIOI/Contests/2018/Algorea_finale/plateau | 7156      | 2147483647 | 1            |
    And the database has the following table "tm_platforms":
      | ID   | name          | public_key | api_url |
      | 1    | codecast-test | -----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt8dBg+ojFTrgFeDxoGqqBSQkW/BDSl/H+qzpIpZTCj4mw7zyrIeV7zaaPuA/8g8WVPDjliuVxLwOnX6p8bT0ZEgsyo4/nql2VEI1cLBqSowQ3VoICqeRYHqgv+8g/B4mFxvRRpNNWiM9aE80KtjXBesi7GjULjg6Jnpqfn1UAGrx4AlnbuabH50/xQoQMWLHSpSVhnpEV5XrUPvzHGbkW51/HRRMEF9Fj5SSPs8vQPbA5ZO8H7NgHwN+8fyNuyVtm9DwY9QZVp2mYlbLlV/+y8xrd5TKf/aGyMjVr3du5YwfosrlrnTAJ+DgoxuZRw77DKaiATxSpEiQRH/C208mOwIDAQAB -----END PUBLIC KEY----- | https://mockapi.com |
    And I seed the ID generator to 100
    And "taskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "idAttempt": "1-0",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """

  Scenario: The first save of an attempt starts a chain of patches
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "def resoudre(n):\n    return n",
            "language": "python",
            "active": true
          }
        ],
        "tests": [
          {
            "name": "Test 1",
            "input": "5",
            "output": "25",
            "active": true,
            "clientId": "user-0"
          }
        ]
      }
      """
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true
      }
      """
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 1-0       | 1      | 1          | 1000   | 1       |
    And the column "fullState" of the table "tm_source_codes_patches" should be set on these rows only:
      | ID  |
      | 100 |
    # The newest patch carries its state in full, it has no reverse patch
    And the column "patch" of the table "tm_source_codes_patches" should be set on these rows only:
      | ID |

  Scenario: The next saves add reverse patches and only the newest one keeps a full state
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "def resoudre(n):\n    return n",
            "language": "python",
            "active": true
          }
        ],
        "tests": [
          {
            "name": "Test 1",
            "input": "5",
            "output": "25",
            "active": true,
            "clientId": "user-0"
          }
        ]
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "def resoudre(n):\n    return n * n",
            "language": "python",
            "active": true
          }
        ],
        "tests": [
          {
            "name": "Test 1",
            "input": "5",
            "output": "25",
            "active": true,
            "clientId": "user-0"
          }
        ]
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "def resoudre(n):\n    return n * n",
            "language": "python",
            "active": false
          },
          {
            "name": "Code 2",
            "source": "print('deux')",
            "language": "c",
            "active": true
          }
        ],
        "tests": [
          {
            "name": "Test 1",
            "input": "5",
            "output": "25",
            "active": true,
            "clientId": "user-0"
          }
        ]
      }
      """
    Then the response status code should be 200
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 1-0       | 1      | 1          | 1000   | 1       |
      | 101 | 1-0       | 1      | 1          | 1000   | 2       |
      | 102 | 1-0       | 1      | 1          | 1000   | 3       |
    And the column "fullState" of the table "tm_source_codes_patches" should be set on these rows only:
      | ID  |
      | 102 |
    # Each save gives the row it replaces the reverse patch that rebuilds it, so every row but the
    # newest one holds the patch of its own state
    And the column "patch" of the table "tm_source_codes_patches" should be set on these rows only:
      | ID  |
      | 100 |
      | 101 |
    When I send a GET request to "/tasks/1000/editor-state/history?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the patches of the response, without their dates and patches, should be:
      """
      [
        {"id": 3, "idUser": "1"},
        {"id": 2, "idUser": "1"},
        {"id": 1, "idUser": "1"}
      ]
      """
    And rebuilding the states of the response should give:
      """
      [
        {
          "sources": [
            {"name": "Code 1", "language": "python", "active": false, "source": ["def resoudre(n):", "    return n * n"]},
            {"name": "Code 2", "language": "c", "active": true, "source": ["print('deux')"]}
          ],
          "tests": [
            {"name": "Test 1", "input": "5", "output": "25", "active": true, "clientId": "user-0"}
          ]
        },
        {
          "sources": [
            {"name": "Code 1", "language": "python", "active": true, "source": ["def resoudre(n):", "    return n * n"]}
          ],
          "tests": [
            {"name": "Test 1", "input": "5", "output": "25", "active": true, "clientId": "user-0"}
          ]
        },
        {
          "sources": [
            {"name": "Code 1", "language": "python", "active": true, "source": ["def resoudre(n):", "    return n"]}
          ],
          "tests": [
            {"name": "Test 1", "input": "5", "output": "25", "active": true, "clientId": "user-0"}
          ]
        }
      ]
      """

  Scenario: Saving twice the same state does not create a patch
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 1-0       | 1      | 1          | 1000   | 1       |

  Scenario: Getting a task returns the last saved editor state of the user of the token
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "def resoudre(n):\n    return n",
            "language": "python"
          },
          {
            "name": "Code 2",
            "source": "",
            "language": "c",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a GET request to "/tasks/1000?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body content at property path "editorState" should be the following JSON:
      """
      {
        "sources": [
          {
            "name": "Code 1",
            "source": "def resoudre(n):\n    return n",
            "language": "python",
            "active": false
          },
          {
            "name": "Code 2",
            "source": "",
            "language": "c",
            "active": true
          }
        ],
        "tests": []
      }
      """
    And the response body content at property path "editorStateReloadError" should be the following JSON:
      """
      null
      """

  # The server logs the database error, which only clutters the test output
  @silentErrors
  Scenario: Getting a task still returns it when the editor state cannot be read from the database
    Given the queries on the table "tm_source_codes_patches" fail
    When I send a GET request to "/tasks/1000?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body content at property path "editorState" should be the following JSON:
      """
      null
      """
    And the response body content at property path "editorStateReloadError" should be the following JSON:
      """
      "database_error"
      """

  # The server logs the decoding error, which only clutters the test output
  @silentErrors
  Scenario: Getting a task still returns it when the saved editor state cannot be decoded
    Given the database has the following table "tm_source_codes_patches":
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch | sDate               | fullState      |
      | 100 | 1-0       | 1      | 1          | 1000   | 1       | 2024-04-10 12:00:00 | not compressed |
    When I send a GET request to "/tasks/1000?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body content at property path "editorState" should be the following JSON:
      """
      null
      """
    And the response body content at property path "editorStateReloadError" should be the following JSON:
      """
      "invalid_state"
      """

  # The history belongs to an attempt, not to a user: the token only gives access to its own attempt
  Scenario: The chain of patches of an attempt is not shared with the other attempts of the same user
    Given "otherAttemptTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "idAttempt": "1-1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{otherAttemptTaskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('deux')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    # Both chains start at 1, they are numbered per attempt, platform and task
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 1-0       | 1      | 1          | 1000   | 1       |
      | 101 | 1-1       | 1      | 1          | 1000   | 1       |
    When I send a GET request to "/tasks/1000/editor-state/history?token={{otherAttemptTaskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And rebuilding the states of the response should give:
      """
      [
        {
          "sources": [
            {"name": "Code 1", "language": "python", "active": true, "source": ["print('deux')"]}
          ],
          "tests": []
        }
      ]
      """
    When I send a GET request to "/tasks/1000?token={{otherAttemptTaskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body content at property path "editorState.sources.0.source" should be the following JSON:
      """
      "print('deux')"
      """

  # In team solving, the attempt is the one of the team: its users share the same chain, and each save
  # tells which user made it
  Scenario: The users of a team share the chain of patches of their attempt
    Given "teammateTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "2",
        "idAttempt": "1-0",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{teammateTaskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('deux')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 1-0       | 1      | 1          | 1000   | 1       |
      | 101 | 1-0       | 2      | 1          | 1000   | 2       |
    When I send a GET request to "/tasks/1000/editor-state/history?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the patches of the response, without their dates and patches, should be:
      """
      [
        {"id": 2, "idUser": "2"},
        {"id": 1, "idUser": "1"}
      ]
      """

  # For the platforms that don't handle attempts, each user has a single attempt
  Scenario: The chain of patches of a token without an attempt is the one of its user
    Given "noAttemptTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """
    Given "otherUserNoAttemptTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "2",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{noAttemptTaskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{otherUserNoAttemptTaskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('deux')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | user:1    | 1      | 1          | 1000   | 1       |
      | 101 | user:2    | 2      | 1          | 1000   | 1       |
    When I send a GET request to "/tasks/1000/editor-state/history?token={{noAttemptTaskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And rebuilding the states of the response should give:
      """
      [
        {
          "sources": [
            {"name": "Code 1", "language": "python", "active": true, "source": ["print('un')"]}
          ],
          "tests": []
        }
      ]
      """

  Scenario: The history is read by pages from the newest save
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('deux')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('trois')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    When I send a GET request to "/tasks/1000/editor-state/history?token={{taskToken}}&platform=codecast-test&limit=2"
    Then the response status code should be 200
    And the response body content at property path "patches.length" should be the following JSON:
      """
      2
      """
    And rebuilding the states of the response should give:
      """
      [
        {"sources": [{"name": "Code 1", "language": "python", "active": true, "source": ["print('trois')"]}], "tests": []},
        {"sources": [{"name": "Code 1", "language": "python", "active": true, "source": ["print('deux')"]}], "tests": []}
      ]
      """
    # The next pages carry no state: the client goes on from the states it rebuilt
    When I send a GET request to "/tasks/1000/editor-state/history?token={{taskToken}}&platform=codecast-test&earlierThanId=1&limit=2"
    Then the response status code should be 200
    And the response body content at property path "state" should be the following JSON:
      """
      null
      """
    And the response body content at property path "patches.0.id" should be the following JSON:
      """
      1
      """
    And the response body content at property path "patches.length" should be the following JSON:
      """
      1
      """

  Scenario: Get the history with an invalid limit
    When I send a GET request to "/tasks/1000/editor-state/history?token={{taskToken}}&platform=codecast-test&limit=0"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: optional property \"limit\"\n└─ cannot decode 0, should be an integer between 1 and 1000"
      }
      """

  Scenario: Get the history with an invalid id
    When I send a GET request to "/tasks/1000/editor-state/history?token={{taskToken}}&platform=codecast-test&earlierThanId=abc"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: optional property \"earlierThanId\"\n└─ cannot decode \"abc\", should be a positive integer"
      }
      """

  Scenario: The insert of a patch is retried with a new ID when the random ID is already taken
    Given the database has the following table "tm_source_codes_patches":
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch | sDate               |
      | 100 | 2-0       | 2      | 1          | 1000   | 1       | 2024-04-10 12:00:00 |
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    # ID 100 was drawn first and collided with the row of the other user
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 2-0       | 2      | 1          | 1000   | 1       |
      | 101 | 1-0       | 1      | 1          | 1000   | 1       |

  # The server logs the database error of the expected 500, which only clutters the test output
  @silentErrors
  Scenario: The save fails when the random ID collides too many times
    Given the database has the following table "tm_source_codes_patches":
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch | sDate               |
      | 100 | 2-0       | 2      | 1          | 1000   | 1       | 2024-04-10 12:00:00 |
      | 101 | 2-0       | 2      | 1          | 1000   | 2       | 2024-04-10 12:01:00 |
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 500
    # An ID collision does not consume the retries of the whole save, which would draw more IDs
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 2-0       | 2      | 1          | 1000   | 1       |
      | 101 | 2-0       | 2      | 1          | 1000   | 2       |

  Scenario: Getting the history of an attempt on which nothing has been saved
    When I send a GET request to "/tasks/1000/editor-state/history?token={{taskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "state": null,
        "patches": []
      }
      """

  Scenario: Save the editor state with a token for another task
    Given "otherTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": true,
        "date": "10-04-2024",
        "idUser": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1001"
      }
      """
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{otherTaskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 401
    And the response body should be the following JSON:
      """
      {
        "error": "Access denied.",
        "message": "Error: Task id mismatch between the requested task and provided task id from the token: 1001"
      }
      """
    And the table "tm_source_codes_patches" should be:
      | ID |

  Scenario: Save the editor state with a read-only token
    Given "readOnlyTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": false,
        "date": "10-04-2024",
        "idUser": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{readOnlyTaskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: Token indicates read-only task"
      }
      """
    And the table "tm_source_codes_patches" should be:
      | ID |

  Scenario: The history of a read-only task can still be read
    Given "readOnlyTaskToken" is a token signed by the platform with the following payload:
      """
      {
        "bSubmissionPossible": false,
        "date": "10-04-2024",
        "idUser": "1",
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """
    When I send a GET request to "/tasks/1000/editor-state/history?token={{readOnlyTaskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "state": null,
        "patches": []
      }
      """

  Scenario: Save the editor state without a token
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "sources": [
          {
            "name": "Code 1",
            "source": "print('un')",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: Missing token or platform parameters"
      }
      """
    And the table "tm_source_codes_patches" should be:
      | ID |

  Scenario: Get the editor state history without a token
    When I send a GET request to "/tasks/1000/editor-state/history"
    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "error": "Incorrect input arguments.",
        "message": "Error: Missing token or platform parameters"
      }
      """

  Scenario: Save the editor state with a malformed payload
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "language": "python"
          }
        ]
      }
      """
    Then the response status code should be 400
    And the table "tm_source_codes_patches" should be:
      | ID |

  Scenario: Save a large editor state that stays under the payload limit
    Given "largeSource" is a string of 190000 characters
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "{{largeSource}}",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 200
    And the table "tm_source_codes_patches" should be:
      | ID  | idAttempt | idUser | idPlatform | idTask | idPatch |
      | 100 | 1-0       | 1      | 1          | 1000   | 1       |

  Scenario: Save an editor state larger than the payload limit of 200 KB
    Given "tooLargeSource" is a string of 210000 characters
    When I send a POST request to "/tasks/1000/editor-state" with the following payload:
      """
      {
        "token": "{{taskToken}}",
        "platform": "codecast-test",
        "sources": [
          {
            "name": "Code 1",
            "source": "{{tooLargeSource}}",
            "language": "python",
            "active": true
          }
        ],
        "tests": []
      }
      """
    Then the response status code should be 413
    And the response body should be the following JSON:
      """
      {
        "statusCode": 413,
        "error": "Request Entity Too Large",
        "message": "Payload content length greater than maximum allowed: 204800"
      }
      """
    And the table "tm_source_codes_patches" should be:
      | ID |
