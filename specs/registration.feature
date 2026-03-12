Feature: User self registration
  As a visitor
  I want to self-register from the login page
  So that I can access the store without admin intervention

  @regression
  Scenario: Visitor opens registration page from login
    Given I am on "/"
    When I click "Not a registered user, please click here"
    Then I should be on "/register"
    And I should see "Create account"

  @regression
  Scenario: Visitor registers successfully and is auto-logged in
    Given I am on "/register"
    When I fill "Display name" with "New User"
    And I fill "Email" with a unique value
    And I fill "Password" with "Password123!"
    And I fill "Street" with "77 Cypress Way"
    And I fill "City" with "Austin"
    And I fill "Zip/Postal code" with "73301"
    And I fill "Country" with "USA"
    And I click "Create account"
    Then API "POST @register" should return "201"
    And I should be on "/store"

  @regression
  Scenario: Duplicate email registration is rejected
    Given I am on "/register"
    When I fill "Display name" with "Existing User"
    And I fill "Email" with "user@example.com"
    And I fill "Password" with "Password123!"
    And I fill "Street" with "1 Existing Street"
    And I fill "City" with "Austin"
    And I fill "Zip/Postal code" with "73301"
    And I fill "Country" with "USA"
    And I click "Create account"
    Then API "POST @register" should return "409"
    And I should see "already exists"

  @regression
  Scenario: Invalid postal code blocks registration
    Given I am on "/register"
    When I fill "Display name" with "Postal User"
    And I fill "Email" with a unique value
    And I fill "Password" with "Password123!"
    And I fill "Street" with "123 Test Ave"
    And I fill "City" with "Austin"
    And I fill "Zip/Postal code" with "ABC-123"
    And I fill "Country" with "USA"
    And I click "Create account"
    Then API "POST @register" should return "400"
    And I should see "Postal code"
