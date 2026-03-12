Feature: Order details page
  As an authenticated store user
  I want to open details for a specific order
  So that I can verify purchased items and fulfillment summary

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "user"

  @smoke @regression
  Scenario: User opens order details from orders list
    Given I am on "/"
    And I log in with valid credentials
    And I add the first catalog item to cart
    And I navigate to "/checkout"
    And I complete checkout with valid payment and address
    And I navigate back to "/store"
    And I click "View orders"
    When I click the first order id link
    Then I should be on "/orders/:orderId"
    And I should see order header details
    And I should see order line items
    And I should see shipping and payment summary

  @regression
  Scenario: Checkout complete order number links to order details
    Given I am on "/"
    And I log in with valid credentials
    And I add the first catalog item to cart
    And I navigate to "/checkout"
    And I complete checkout with valid payment and address
    When I click the checkout success order number
    Then I should be on "/orders/:orderId"
    And I should see order header details

  @regression
  Scenario: Unknown order id shows deterministic not-found state
    Given I am on "/"
    And I log in with valid credentials
    And API "GET /api/orders/:orderId" returns "404" with message "Order not found"
    When I navigate to "/orders/:unknownOrderId"
    Then I should see error "Order not found"
