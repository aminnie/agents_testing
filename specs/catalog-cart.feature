Feature: Catalog and cart
  As a shopper
  I want to browse products and add them to my cart
  So that I can prepare for checkout

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "user"

  @smoke @regression
  Scenario: Catalog list is visible after login
    Given I am on "/"
    When I log in with valid credentials
    Then I should see at least 20 catalog items

  @smoke @regression
  Scenario: User adds a catalog item to cart
    Given I am on "/"
    And I log in with valid credentials
    When I add the first catalog item to cart
    Then cart should contain 1 item
    And cart total should be greater than "$0.00"
    And header cart count should show "1"

  @regression
  Scenario: Header cart icon opens checkout
    Given I am on "/"
    And I log in with valid credentials
    And I add the first catalog item to cart
    When I click the header cart icon
    Then I should be on "/checkout"
    And I should see "Checkout"

  @regression
  Scenario: User views a catalog item detail and adds it to cart
    Given I am on "/"
    And I log in with valid credentials
    When I open the first catalog item detail screen
    And I add the item to cart from the detail screen
    Then I should return to "/store"
    And cart should contain 1 item

  @regression
  Scenario: User returns from item detail without adding
    Given I am on "/"
    And I log in with valid credentials
    When I open the first catalog item detail screen
    And I return to the catalog list without adding the item
    Then I should return to "/store"
    And cart should remain empty

  @regression
  Scenario: Header cart count resets after successful checkout
    Given I am on "/"
    And I log in with valid credentials
    And I add the first catalog item to cart
    When I proceed to checkout and complete order confirmation
    Then header cart count should show "0"
