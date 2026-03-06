Feature: <Feature Name>
  As a <role>
  I want to <goal>
  So that <business value>

  Background:
    Given test data "<fixture_or_seed>"
    And I am authenticated as "<role>" # or "I am unauthenticated"

  @smoke @regression
  Scenario: <Happy path title>
    Given I am on "<route_or_page>"
    When I perform "<action_1>"
    And I perform "<action_2>"
    Then I should see "<ui_state_or_message>"
    And the URL should include "<path>"
    And API "<method> <endpoint_alias>" should return "<status_code>"

  @regression
  Scenario: <Validation or edge case title>
    Given I am on "<route_or_page>"
    When I perform "<invalid_or_edge_action>"
    Then I should see error "<error_message>"
    And no request is sent to "<endpoint_alias>" # or specific assertion

  @regression
  Scenario: <Permission or security case title>
    Given I am authenticated as "<restricted_role>"
    When I navigate to "<restricted_route>"
    Then I should see "<forbidden_or_redirect_behavior>"
