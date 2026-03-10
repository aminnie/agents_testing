Feature: Admin user management
  As an admin
  I want to update user profile and role assignments
  So that user access can be managed from the application

  @regression
  Scenario: Admin updates a user profile and role
    Given I am on "/"
    And I log in as "admin@example.com"
    When I open "User admin" from top navigation
    And I select user "shopper@example.com"
    And I update email to "shopper@example.com"
    And I update display name
    And I select role "editor"
    And I click "Save user"
    Then API "PUT @adminUpdateUser" should return "200"
    And I should see a success confirmation

  @regression
  Scenario: Non-admin users cannot access user admin
    Given I am on "/"
    And I log in as "user@example.com"
    Then "User admin" should not be visible in top navigation
    When I navigate to "/admin/users"
    Then I should be redirected to "/store"
    And API "GET /api/admin/users" should return "403" for this user

  @regression
  Scenario: Final-admin safeguard prevents removing last admin role
    Given I am on "/"
    And I log in as "admin@example.com"
    When I open "User admin" from top navigation
    And I select user "admin@example.com"
    And I select role "user"
    And I click "Save user"
    Then API "PUT @adminUpdateUser" should return "409"
    And I should see "last remaining admin"
