export class UserAdminPage {
  openFromHeader() {
    cy.get('[data-cy="nav-user-admin"]').click();
  }

  userSelect() {
    return cy.get('[data-cy="admin-user-select"]');
  }

  emailInput() {
    return cy.get('[data-cy="admin-user-email"]');
  }

  displayNameInput() {
    return cy.get('[data-cy="admin-user-display-name"]');
  }

  roleSelect() {
    return cy.get('[data-cy="admin-user-role"]');
  }

  saveButton() {
    return cy.get('[data-cy="admin-user-save"]');
  }

  successAlert() {
    return cy.get('[data-cy="admin-user-success"]');
  }

  errorAlert() {
    return cy.get('[data-cy="admin-user-error"]');
  }

  selectUserByEmail(email: string) {
    this.userSelect().find("option").contains(email).then(($option) => {
      cy.wrap($option).invoke("val").then((value) => {
        this.userSelect().select(String(value));
      });
    });
  }
}
