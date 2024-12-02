Feature: Get Git repository branches

  Background: Init fake repo
    Given there is a fake Git repository

  Scenario: Get known repository
    When I send a GET request to "/git/repository-folder-content?repository=/tmp/git-repo-test&branch=master"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": [
          {
            "directory": true,
            "name": "subfolder"
          },
          {
            "directory": false,
            "name": "test.txt"
          }
       ]
      }
      """

  Scenario: Get known repository subfolder
    When I send a GET request to "/git/repository-folder-content?repository=/tmp/git-repo-test&branch=master&folder=subfolder"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": [
          {
            "directory": false,
            "name": "subfile.txt"
          }
       ]
      }
      """

  Scenario: Get known repository subfolder for another branch
    When I send a GET request to "/git/repository-folder-content?repository=/tmp/git-repo-test&branch=other"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": [
         {
            "directory": true,
            "name": "subfolder"
          },
          {
            "directory": false,
            "name": "test.txt"
          },
          {
            "directory": false,
            "name": "test2.txt"
          }
       ]
      }
      """

  Scenario: Get unknown repository
    When I send a GET request to "/git/repository-branches?repository=/tmp/git-repo-test-unknown"
    Then the response status code should be 404
