Feature: Get task

  Scenario: Get task by id
    Given there is a default task in the database
    When the server receives a GET request to "/tasks/{defaultTaskId}"
    Then the server should return the status code 200
    Then the server response should include the following object: "get_task_response.json"

  Scenario: Get unknown task
    When the server receives a GET request to "/tasks/999999"
    Then the server should return the status code 404
