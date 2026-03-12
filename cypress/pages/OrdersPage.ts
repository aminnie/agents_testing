export class OrdersPage {
  title() {
    return cy.get('[data-cy="orders-page-title"]');
  }

  list() {
    return cy.get('[data-cy="orders-list"]');
  }

  firstOrderLink() {
    return cy.get('[data-cy^="orders-link-"]').first();
  }

  emptyState() {
    return cy.get('[data-cy="orders-empty"]');
  }

  errorMessage() {
    return cy.get('[data-cy="orders-error"]');
  }
}
