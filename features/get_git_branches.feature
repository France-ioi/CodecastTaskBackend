Feature: Get Git repository branches

  Background: Init fake repo
    Given there is a fake Git repository

  Scenario: Get known repository
    When I send a GET request to "/git/repository-branches?repository=/tmp/git-repo-test"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "branches": ["master", "other"]
      }
      """

  Scenario: Get unknown repository
    When I send a GET request to "/git/repository-branches?repository=/tmp/git-repo-test-unknown"
    Then the response status code should be 404
