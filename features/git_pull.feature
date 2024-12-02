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

  Scenario: Pull known repository with changes
    Given I make a commit on the fake Git repository changing the file "test.txt" to this content: "Test\nGit\nFile\nSample"
    When I send a POST request to "/git/pull" with the following payload:
      """
      {
        "repository": "/tmp/git-repo-test",
        "branch": "master",
        "file": "test.txt",
        "revision": "{{currentRevisionNumber}}",
        "source": "Test\nGit\nFile changed\nSample"
      }
      """

    Then the response status code should be 400
    And I update the current revision number of the fake repository
    And the response body should be the following JSON:
      """
      {
        "success": false,
        "error": "conflict",
        "conflict_source": "<<<<<<< Remote changes\nTest\\nGit\\nFile\\nSample\n=======\nTest\nGit\nFile changed\nSample\n>>>>>>> Your changes\n",
        "conflict_revision": "{{currentRevisionNumber}}"
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
