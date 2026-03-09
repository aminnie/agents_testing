Feature: Checkout
  As a shopper
  I want to complete checkout
  So that I can place an order

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "user"
    And cart contains "SKU-123" quantity "1"

  @smoke @regression
  Scenario: Successful checkout with card
    Given I am on "/"
    And I log in with valid credentials
    And I add the first catalog item to cart
    And I navigate to "/checkout"
    When I fill "Name on card" with "Anton Minnie"
    And I fill "Card number" with "4242424242424242"
    And I click "Confirm order"
    Then I should see "Order confirmed"
    And checkout payment dialog should be hidden
    And API "POST @checkout" should return "201"

  @regression
  Scenario: Missing payment fields blocks order
    Given I am on "/"
    And I log in with valid credentials
    And I add the first catalog item to cart
    And I navigate to "/checkout"
    When I click "Confirm order"
    Then I should see error "Payment details are required"

  @regression
  Scenario: Empty cart blocks checkout
    Given I am on "/"
    And I log in with valid credentials
    And I navigate to "/checkout"
    When I fill "Name on card" with "Anton Minnie"
    And I fill "Card number" with "4242424242424242"
    And I click "Confirm order"
    Then I should see error "Cart cannot be empty"
