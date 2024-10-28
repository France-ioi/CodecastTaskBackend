Feature: Get Git repository branches

  Scenario: Get known repository
    When I send a GET request to "/git/repository-branches?repository=git%40github.com%3AFrance-ioi%2Falkindi-task-50-messages.git"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "branches": ["master", "substitution_task"]
      }
      """

  Scenario: Get unknown repository
    When I send a GET request to "/git/repository-branches?repository=git%40github.com%3AUnknown%2FUnknown-repository.git"
    Then the response status code should be 404
