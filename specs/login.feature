Feature: Login
  As a registered user
  I want to sign in
  So that I can access my dashboard

  Background:
    Given test data "users/default-user.json"
    And I am unauthenticated

  @smoke @regression
  Scenario: Successful login
    Given I am on "/"
    When I fill "email" with "user@example.com"
    And I fill "password" with "CorrectHorseBatteryStaple1!"
    And I click "Sign in"
    Then I should see "My Store"
    And API "POST @login" should return "200"

  @regression
  Scenario: Invalid password shows error
    Given I am on "/"
    When I fill "email" with "user@example.com"
    And I fill "password" with "wrong-password"
    And I click "Sign in"
    Then I should see error "Invalid email or password"
    And I should still see "Mini Store Login"

  @regression
  Scenario: Required field validation
    Given I am on "/"
    When I click "Sign in"
    Then I should see error "Email and password are required"

  @regression
  Scenario: Session persists after reload
    Given I am on "/"
    When I log in with valid credentials
    And I reload the page
    Then I should see "My Store"
    And I should see "user@example.com"

  @regression
  Scenario: Logout clears local session
    Given I am on "/"
    And I log in with valid credentials
    When I click "Logout"
    Then I should see "Mini Store Login"
    And token should be removed from local storage
