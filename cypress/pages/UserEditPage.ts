export class UserEditPage {
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

  cancelButton() {
    return cy.get('[data-cy="admin-user-cancel"]');
  }

  successAlert() {
    return cy.get('[data-cy="admin-user-success"]');
  }

  errorAlert() {
    return cy.get('[data-cy="admin-user-error"]');
  }
}
