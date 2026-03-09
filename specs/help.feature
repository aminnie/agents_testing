Feature: Help
  As a demo user
  I want in-app help information
  So that I can find credentials and navigate the application

  Background:
    Given I am on "/help"

  @smoke @regression
  Scenario: Help page shows demo users and guidance
    When help information loads successfully
    Then I should see "Help"
    And I should see demo user credentials
    And I should see navigation guidance

  @regression
  Scenario: Help page handles API failure gracefully
    Given API "GET @help" returns "500"
    When I open "/help"
    Then I should see "Unable to load help information right now."
