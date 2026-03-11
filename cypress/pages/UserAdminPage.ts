export class UserAdminPage {
  openFromHeader() {
    cy.get('[data-cy="nav-user-admin"]').click();
  }

  searchInput() {
    return cy.get('[data-cy="admin-users-search-input"]');
  }

  searchSubmitButton() {
    return cy.get('[data-cy="admin-users-search-submit"]');
  }

  searchClearButton() {
    return cy.get('[data-cy="admin-users-search-clear"]');
  }

  pageIndicator() {
    return cy.get('[data-cy="admin-users-page-indicator"]');
  }

  pageSizeSelect() {
    return cy.get('[data-cy="admin-users-page-size"]');
  }

  firstPageButton() {
    return cy.get('[data-cy="admin-users-page-first"]');
  }

  prevPageButton() {
    return cy.get('[data-cy="admin-users-page-prev"]');
  }

  nextPageButton() {
    return cy.get('[data-cy="admin-users-page-next"]');
  }

  lastPageButton() {
    return cy.get('[data-cy="admin-users-page-last"]');
  }

  editButtonByUserId(userId: string | number) {
    return cy.get(`[data-cy="admin-user-edit-${userId}"]`);
  }

  editButtonByEmail(email: string) {
    return cy.contains('[data-cy^="admin-user-row-email-"]', email)
      .parents("li")
      .find('[data-cy^="admin-user-edit-"]');
  }

  noResultsMessage() {
    return cy.get('[data-cy="admin-users-no-results"]');
  }
}
