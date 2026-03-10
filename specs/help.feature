Feature: Help
  As a demo user
  I want in-app help information
  So that I can understand how to use and navigate the application

  Background:
    Given I am on "/help"

  @smoke @regression
  Scenario: Help page shows navigation guidance without user listing
    When help information loads successfully
    Then I should see "Help"
    And I should not see demo user credentials
    And I should see navigation guidance

  @regression
  Scenario: Help page handles API failure gracefully
    Given API "GET @help" returns "500"
    When I open "/help"
    Then I should see "Unable to load help information right now."
