Feature: Pull Git repository

  Scenario: Pull known repository
    When I send a POST request to "/git/pull" with the following payload:
      """
      {
        "repository": "git@github.com:France-ioi/alkindi-task-50-messages.git",
        "branch": "master",
        "file": ".gitignore"
      }
      """

    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": "/node_modules\n",
        "revision": "e91d63f1e2fa42dfe7bc943d73ef4f872f2137ab"
      }
      """
