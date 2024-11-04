Feature: Pull Git repository

  Background: Init fake repo
    Given there is a fake Git repository

  Scenario: Pull known repository
    When I send a POST request to "/git/pull" with the following payload:
      """
      {
        "repository": "/tmp/git-repo-test",
        "branch": "master",
        "file": "test.txt"
      }
      """

    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": "Test\nGit\nFile\nSample",
        "revision": "{{currentRevisionNumber}}"
      }
      """

  Scenario: Pull unknown repository
    When I send a POST request to "/git/pull" with the following payload:
      """
      {
        "repository": "/tmp/git-repo-test-unknown",
        "branch": "master",
        "file": "test.txt"
      }
      """

    Then the response status code should be 404
