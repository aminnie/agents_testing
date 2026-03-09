Feature: Catalog pagination
  As a store shopper
  I want catalog pagination controls
  So that I can browse large catalogs in manageable pages

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "user"

  @smoke @regression
  Scenario: Default pagination uses page size 10 and page navigation controls
    Given I am on "/"
    When I log in as "user@example.com"
    Then I should see page indicator for the first page
    And the catalog list should show 10 items
    And "First" and "Previous" controls should be disabled on first page
    And navigation controls should reflect whether additional pages exist
    When I navigate to the next page (if available)
    Then page indicator should update to that page

  @regression
  Scenario: Page size options include 10, 20, and 50
    Given I am on "/"
    And I log in as "user@example.com"
    When I set page size to "20"
    Then I should see page indicator for page 1 with page size 20
    When I set page size to "50"
    Then I should still see page indicator for page 1 with page size 50
    And if all catalog items fit on one page, all pagination navigation controls should be disabled

  @regression
  Scenario: Detail return restores exact pagination state
    Given I am on "/store?page=<targetPage>&pageSize=10"
    When I view the first catalog item detail
    And I click "Return to catalog"
    Then I should return to "/store?page=<targetPage>&pageSize=10"
    And I should see the same page indicator as before opening item detail
