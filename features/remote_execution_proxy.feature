Feature: Proxy websocket connections from client to remote server

  Background:
    Given I have a "client" WS server on port 9002
    And I have a "server" WS server on port 9003

  Scenario: Bidirectional proxying of messages
    When I connect to the "client" WS server
    And I send to the "client" WS server the following JSON:
      """
      {
        "messageId": 0,
        "message": {
          "action": "start"
        }
      }
      """
    And I wait 100ms
    Then the "server" WS server should have received a new connection
    And the "server" WS server should have received the following JSON:
      """
      {
        "messageId": 0,
        "message": {
          "action": "start"
        }
      }
      """
    When I send to the "server" WS server the following JSON:
      """
      {
        "messageId": 1,
        "message": {
          "success": true
        }
      }
      """
    And I wait 10ms
    Then the "client" WS server should have received the following JSON:
      """
      {
        "messageId": 1,
        "message": {
          "success": true
        }
      }
      """
