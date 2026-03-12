Feature: Orders list
  As an authenticated store user
  I want to view my previously placed orders
  So that I can confirm my order history

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "user"

  @smoke @regression
  Scenario: User can access orders list from catalog and view order headers
    Given I am on "/"
    And I log in with valid credentials
    And I add the first catalog item to cart
    And I navigate to "/checkout"
    And I complete checkout with valid payment and address
    When I navigate back to "/store"
    And I click "View orders"
    Then I should be on "/orders"
    And I should see at least one order header row
    And each order row should show order id, date, and total
    And order row should not show line-item details

  @regression
  Scenario: Empty orders list shows deterministic empty state
    Given I am on "/"
    And I log in with valid credentials
    And API "GET /api/orders" returns an empty orders response
    When I click "View orders"
    Then I should be on "/orders"
    And I should see "No previous orders"

  @regression
  Scenario: Orders API failure shows deterministic error
    Given I am on "/"
    And I log in with valid credentials
    And API "GET /api/orders" returns "500" with message "Could not load orders"
    When I click "View orders"
    Then I should be on "/orders"
    And I should see error "Could not load orders"
