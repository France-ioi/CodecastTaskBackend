Feature: Push Git repository

  Background: Init fake repo
    Given there is a fake Git repository

  Scenario: Push to known repository
    When I send a POST request to "/git/push" with the following payload:
      """
      {
        "repository": "/tmp/git-repo-test",
        "branch": "master",
        "file": "test.txt",
        "source": "Test\nGit\nFile\nSample",
        "revision": "{{currentRevisionNumber}}",
        "username": "Test User",
        "commitMessage": "Test commit message"
      }
      """

    Then the response status code should be 200
    And I update the current revision number of the repository at "/tmp/git-repo-test"
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "revision": "{{currentRevisionNumber}}"
      }
      """

  Scenario: Push to known repository but there has been changes
    Given I update the current revision number of the repository at "/tmp/git-repo-test"
    And I make a commit on the fake Git repository changing the file "test.txt" to this content: "Test\nGit\nFile\nSample"
    When I send a POST request to "/git/push" with the following payload:
      """
      {
        "repository": "/tmp/git-repo-test",
        "branch": "master",
        "file": "test.txt",
        "source": "Test\nGit\nFile\nSample",
        "revision": "{{currentRevisionNumber}}",
        "username": "Test User",
        "commitMessage": "Test commit message"
      }
      """

    Then the response status code should be 400
    And the response body should be the following JSON:
      """
      {
        "success": false,
        "error": "not_up_to_date"
      }
      """

  Scenario: Push to unknown repository
    When I send a POST request to "/git/push" with the following payload:
      """
      {
        "repository": "/tmp/git-repo-test-unknown",
        "branch": "master",
        "file": "test.txt",
        "source": "Test\nGit\nFile\nSample",
        "revision": "{{currentRevisionNumber}}",
        "username": "Test User",
        "commitMessage": "Test commit message"
      }
      """

    Then the response status code should be 404
