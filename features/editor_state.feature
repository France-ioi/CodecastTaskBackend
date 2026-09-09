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
        "itemUrl": "https://codecast.france-ioi.org/next/task?taskId=1000"
      }
      """

  Scenario: The first save of a user starts a chain of patches
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
      | ID  | idUser | idPlatform | idTask | idPatch |
      | 100 | 1      | 1          | 1000   | 1       |
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
      | ID  | idUser | idPlatform | idTask | idPatch |
      | 100 | 1      | 1          | 1000   | 1       |
      | 101 | 1      | 1          | 1000   | 2       |
      | 102 | 1      | 1          | 1000   | 3       |
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
    And the response body content at property path "patches.length" should be the following JSON:
      """
      3
      """
    And the response body content at property path "patches.0.patchId" should be the following JSON:
      """
      3
      """
    And the response body content at property path "patches.0.patch" should be the following JSON:
      """
      null
      """
    And rebuilding the states of the response should give:
      """
      [
        {
          "sources": [
            {
              "name": "Code 1",
              "language": "python",
              "active": false,
              "source": ["def resoudre(n):", "    return n * n"]
            },
            {
              "name": "Code 2",
              "language": "c",
              "active": true,
              "source": ["print('deux')"]
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
        },
        {
          "sources": [
            {
              "name": "Code 1",
              "language": "python",
              "active": true,
              "source": ["def resoudre(n):", "    return n * n"]
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
        },
        {
          "sources": [
            {
              "name": "Code 1",
              "language": "python",
              "active": true,
              "source": ["def resoudre(n):", "    return n"]
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
      | ID  | idUser | idPlatform | idTask | idPatch |
      | 100 | 1      | 1          | 1000   | 1       |

  Scenario: Saving a state which only changes the active tab and the active test does not create a patch
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
          },
          {
            "name": "Code 2",
            "source": "print('deux')",
            "language": "python",
            "active": false
          }
        ],
        "tests": [
          {
            "name": "Test 1",
            "input": "5",
            "output": "25",
            "active": true,
            "clientId": "user-0"
          },
          {
            "name": "Test 2",
            "input": "6",
            "output": "36",
            "active": false,
            "clientId": "user-1"
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
            "source": "print('un')",
            "language": "python",
            "active": false
          },
          {
            "name": "Code 2",
            "source": "print('deux')",
            "language": "python",
            "active": true
          }
        ],
        "tests": [
          {
            "name": "Test 1",
            "input": "5",
            "output": "25",
            "active": false,
            "clientId": "user-0"
          },
          {
            "name": "Test 2",
            "input": "6",
            "output": "36",
            "active": true,
            "clientId": "user-1"
          }
        ]
      }
      """
    Then the response status code should be 200
    And the table "tm_source_codes_patches" should be:
      | ID  | idUser | idPlatform | idTask | idPatch |
      | 100 | 1      | 1          | 1000   | 1       |

  Scenario: Saving a state without tests keeps the tests of the previous state
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
            "source": "print('deux')",
            "language": "python",
            "active": true
          }
        ],
        "tests": null
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
            "source": "print('deux')",
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

  Scenario: The chain of patches of a user is not shared with the other users
    Given "otherUserTaskToken" is a token signed by the platform with the following payload:
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
        "token": "{{otherUserTaskToken}}",
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
    # Both chains start at 1, they are numbered per user, platform and task
    And the table "tm_source_codes_patches" should be:
      | ID  | idUser | idPlatform | idTask | idPatch |
      | 100 | 1      | 1          | 1000   | 1       |
      | 101 | 2      | 1          | 1000   | 1       |
    When I send a GET request to "/tasks/1000/editor-state/history?token={{otherUserTaskToken}}&platform=codecast-test"
    Then the response status code should be 200
    And rebuilding the states of the response should give:
      """
      [
        {
          "sources": [
            {
              "name": "Code 1",
              "language": "python",
              "active": true,
              "source": ["print('deux')"]
            }
          ],
          "tests": []
        }
      ]
      """

  Scenario: Getting the history of a user who has never saved anything
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
        ]
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
