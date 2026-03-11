Feature: Catalog search
  As a store shopper
  I want to search catalog items
  So that I can find matching products without paging through the entire list

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "user"

  @smoke @regression
  Scenario: Search runs only on explicit submit and persists in URL
    Given I am on "/"
    And I log in as "user@example.com"
    When I enter a valid search query in catalog search input
    Then catalog should not filter until I click "Search"
    When I click "Search"
    Then catalog should show filtered results
    And URL query should include active search state

  @regression
  Scenario: Search submit resets pagination to first page
    Given I am on "/"
    And I log in as "user@example.com"
    And I navigate to page 2 of catalog
    When I submit a valid search query
    Then catalog should return to page 1 with filtered results

  @regression
  Scenario: Clear search restores full catalog behavior
    Given I am on "/"
    And I log in as "user@example.com"
    When I submit a query with zero matches
    Then I should see "No results"
    When I click "Clear"
    Then search state should be removed from URL
    And full catalog listing behavior should be restored

  @regression
  Scenario: Search input enforces 20-character maximum
    Given I am on "/"
    And I log in as "user@example.com"
    When I enter a query longer than 20 characters and submit
    Then I should see a deterministic validation error
