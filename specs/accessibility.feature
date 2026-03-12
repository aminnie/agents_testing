Feature: Accessibility baseline checks
  As a Product Owner
  I want repeatable WCAG accessibility checks
  So that we can measure compliance progress with objective results

  @a11y @regression
  Scenario: Public pages pass automated WCAG checks
    Given I am on "/"
    Then I should see no WCAG accessibility violations on login page
    When I navigate to "/help"
    Then I should see no WCAG accessibility violations on help page

  @a11y @regression
  Scenario: Authenticated core pages pass automated WCAG checks
    Given I am authenticated as "user"
    Then I should see no WCAG accessibility violations on store page
    When I run a catalog search that produces no matches
    Then I should see no WCAG accessibility violations on store no-results state
    When I open the orders list from the catalog page
    Then I should see no WCAG accessibility violations on orders page
    When I open an order details page from the orders list
    Then I should see no WCAG accessibility violations on order details page
    When I open an item detail page
    Then I should see no WCAG accessibility violations on item detail page
    When I navigate to checkout with one item in cart
    Then I should see no WCAG accessibility violations on checkout page

  @a11y @regression
  Scenario: Product form page passes automated WCAG checks for product managers
    Given I am authenticated as "editor"
    When I open the new product form
    Then I should see no WCAG accessibility violations on product form page

  @a11y @regression
  Scenario: Admin user management page passes automated WCAG checks
    Given I am authenticated as "admin"
    When I open the user-admin page from top navigation
    Then I should see no WCAG accessibility violations on admin user management page
