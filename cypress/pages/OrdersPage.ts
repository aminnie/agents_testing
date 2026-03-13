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

  firstOrderStatus() {
    return cy.get('[data-cy^="orders-status-"]').first();
  }

  cancelButton(orderId: string) {
    return cy.get(`[data-cy="orders-cancel-${orderId}"]`);
  }

  cancelModal() {
    return cy.get('[data-cy="orders-cancel-modal"]');
  }

  cancelReasonInput() {
    return cy.get('[data-cy="orders-cancel-reason-input"]');
  }

  cancelModalProceed() {
    return cy.get('[data-cy="orders-cancel-modal-proceed"]');
  }

  cancelModalCancel() {
    return cy.get('[data-cy="orders-cancel-modal-cancel"]');
  }

  emptyState() {
    return cy.get('[data-cy="orders-empty"]');
  }

  errorMessage() {
    return cy.get('[data-cy="orders-error"]');
  }

  searchInput() {
    return cy.get('[data-cy="orders-search-input"]');
  }

  searchSubmit() {
    return cy.get('[data-cy="orders-search-submit"]');
  }

  searchClear() {
    return cy.get('[data-cy="orders-search-clear"]');
  }

  pageIndicator() {
    return cy.get('[data-cy="orders-page-indicator"]');
  }

  pageSize() {
    return cy.get('[data-cy="orders-page-size"]');
  }

  nextPage() {
    return cy.get('[data-cy="orders-page-next"]');
  }

  prevPage() {
    return cy.get('[data-cy="orders-page-prev"]');
  }

  noResults() {
    return cy.get('[data-cy="orders-no-results"]');
  }
}
