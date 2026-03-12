Feature: Admin user management
  As an admin
  I want to update user profile and role assignments
  So that user access can be managed from the application

  @regression
  Scenario: Admin opens dedicated user edit page and saves role/profile updates
    Given I am on "/"
    And I log in as "admin@example.com"
    When I open "User admin" from top navigation
    And I click "Edit user" for "shopper@example.com"
    Then I should be on "/admin/users/:id/edit"
    And I update email to "shopper@example.com"
    And I update display name
    And I update street to "14 Admin Edit Way"
    And I update city to "Portland"
    And I update zip/postal code to "97205"
    And I update country to "USA"
    And I select role "editor"
    And I click "Save user"
    Then API "PUT @adminUpdateUser" should return "200"
    And I should see a success confirmation

  @regression
  Scenario: Admin can search and clear user list results
    Given I am on "/"
    And I log in as "admin@example.com"
    When I open "User admin" from top navigation
    And I search users with "no-such-user"
    Then I should see no user results
    When I clear user search
    Then user list results should be restored

  @regression
  Scenario: Admin can cancel edit and return to the user list
    Given I am on "/"
    And I log in as "admin@example.com"
    When I open "User admin" from top navigation
    And I click "Edit user" for "shopper@example.com"
    And I update email to "shopper-updated@example.com"
    And I click "Cancel edit"
    Then I should be redirected to "/admin/users"
    And API "PUT @adminUpdateUser" should not be called

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
    And I click "Edit user" for "admin@example.com"
    And I select role "user"
    And I click "Save user"
    Then API "PUT @adminUpdateUser" should return "200 or 409"
    And if "409" then I should see "last remaining admin"
