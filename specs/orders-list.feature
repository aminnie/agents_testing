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
    And each order row should show order id, date, total, and status
    And cancellation is only offered for orders in status "Ordered" or "Processing"
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
  Scenario: User can search previous orders by order number or item text
    Given I am on "/"
    And I log in with valid credentials
    And API "GET /api/orders" returns a paginated orders response with multiple rows
    When I click "View orders"
    And I search orders for "01012024-00002"
    Then I should see only matching order rows
    When I search orders for "NO_MATCH_QUERY"
    Then I should see "No matching orders"

  @regression
  Scenario: User can paginate orders and changing page size resets to first page
    Given I am on "/"
    And I log in with valid credentials
    And API "GET /api/orders" returns paginated metadata for multiple pages
    When I click "View orders"
    And I go to the next orders page
    Then orders page indicator should show page "2"
    When I change orders page size to "20"
    Then orders page indicator should show page "1"
    And the orders request should use page "1" with page size "20"

  @regression
  Scenario: Orders API failure shows deterministic error
    Given I am on "/"
    And I log in with valid credentials
    And API "GET /api/orders" returns "500" with message "Could not load orders"
    When I click "View orders"
    Then I should be on "/orders"
    And I should see error "Could not load orders"
