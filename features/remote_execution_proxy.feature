Feature: Proxy websocket connections from client to remote server

  Background:
    Given I have a "backend" WS server on port 9002
    And I have a "debuggers-mock" WS server on port 9003

  Scenario: Bidirectional proxying of messages
    When I connect to the "backend" WS server
    And I send to the "backend" WS server the following JSON:
      """
      {
        "messageId": 0,
        "message": {
          "action": "start"
        }
      }
      """
    And I wait 100ms
    Then the "debuggers-mock" WS server should have received a new connection
    And the "debuggers-mock" WS server should have received the following JSON:
      """
      {
        "messageId": 0,
        "message": {
          "action": "start"
        }
      }
      """
    When I send to the "debuggers-mock" WS server the following JSON:
      """
      {
        "messageId": 1,
        "message": {
          "success": true
        }
      }
      """
    And I wait 10ms
    Then the "backend" WS server should have received the following JSON:
      """
      {
        "messageId": 1,
        "message": {
          "success": true
        }
      }
      """
