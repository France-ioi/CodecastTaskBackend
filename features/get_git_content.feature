Feature: Get Git repository branches

  Scenario: Get known repository
    When I send a GET request to "/git/repository-folder-content?repository=git%40github.com%3AFrance-ioi%2Falkindi-task-50-messages.git&branch=master"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": [
          {
            "directory": true,
            "name": "bebras-modules"
          },
          {
            "directory": true,
            "name": "server-modules"
          },
          {
            "directory": true,
            "name": "src"
          },
          {
            "directory": false,
            "name": ".eslintrc"
          },
          {
            "directory": false,
            "name": ".gitignore"
          },
          {
            "directory": false,
            "name": ".gitmodules"
          },
          {
            "directory": false,
            "name": "README.md"
          },
          {
            "directory": false,
            "name": "index.html"
          },
          {
            "directory": false,
            "name": "package-lock.json"
          },
          {
            "directory": false,
            "name": "package.json"
          },
          {
            "directory": false,
            "name": "webpack.config.js"
          }
       ]
      }
      """

  Scenario: Get known repository subfolder
    When I send a GET request to "/git/repository-folder-content?repository=git%40github.com%3AFrance-ioi%2Falkindi-task-50-messages.git&branch=master&folder=server-modules"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": [
          {
            "directory": false,
            "name": "index.js"
          },
          {
            "directory": false,
            "name": "sentences.js"
          }
       ]
      }
      """

  Scenario: Get known repository subfolder for another branch
    When I send a GET request to "/git/repository-folder-content?repository=git%40github.com%3AFrance-ioi%2Falkindi-task-50-messages.git&branch=substitution_task&folder=server-modules"
    Then the response status code should be 200
    And the response body should be the following JSON:
      """
      {
        "success": true,
        "content": [
          {
            "directory": false,
            "name": "generator.js"
          },
          {
            "directory": false,
            "name": "index.js"
          }
       ]
      }
      """

  Scenario: Get unknown repository
    When I send a GET request to "/git/repository-branches?repository=git%40github.com%3AUnknown%2FUnknown-repository.git"
    Then the response status code should be 404
