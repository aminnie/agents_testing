Feature: Catalog editor workflows
  As an editor
  I want to create and edit products
  So that I can maintain the catalog

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "editor"

  @smoke @regression
  Scenario: Editor creates a product from navigation controls
    Given I am on "/"
    When I log in as "editor@example.com"
    And I click "New product"
    And I fill "Header" with "Editor Created Product"
    And I fill "Description" with "Editor created this catalog item."
    And I fill "Price (cents)" with "2500"
    And I click "Save product"
    Then I should return to "/store"
    And I should see "Editor Created Product" in the catalog list
    And API "POST @catalogCreate" should return "201"

  @regression
  Scenario: Editor edits a product from catalog and detail entry points
    Given I am on "/"
    And I log in as "editor@example.com"
    When I click "Edit product" for the first catalog item
    And I update "Header" to "Editor Updated Product"
    And I update "Description" to "Updated by editor from catalog view."
    And I update "Price (cents)" to "3100"
    And I click "Save product"
    Then I should return to "/store"
    And API "PUT @catalogUpdate" should return "200"
    When I view the first catalog item detail
    Then "Edit product" should be enabled on the detail page

  @regression
  Scenario: Non-manager and non-editor users do not see product-management controls
    Given I am on "/"
    And I log in as "user@example.com"
    Then "New product" should not be visible
    And first catalog "Edit product" control should not be visible
    When I view the first catalog item detail
    Then detail "New product" control should not be visible
    And detail "Edit product" control should not be visible

  @regression
  Scenario: Manager can create and edit products
    Given I am on "/"
    And I log in as "manager@example.com"
    When I click "New product"
    And I fill "Header" with "Manager Created Product"
    And I fill "Description" with "Manager created this catalog item."
    And I fill "Price (cents)" with "2600"
    And I click "Save product"
    Then API "POST @catalogCreate" should return "201"
    And I should return to "/store"
