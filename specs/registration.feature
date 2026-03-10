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
    And I click "Create account"
    Then API "POST @register" should return "201"
    And I should be on "/store"

  @regression
  Scenario: Duplicate email registration is rejected
    Given I am on "/register"
    When I fill "Display name" with "Existing User"
    And I fill "Email" with "user@example.com"
    And I fill "Password" with "Password123!"
    And I click "Create account"
    Then API "POST @register" should return "409"
    And I should see "already exists"
