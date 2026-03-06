declare global {
  namespace Cypress {
    interface Chainable {
      loginUi(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add(
  "loginUi",
  (email = "user@example.com", password = "CorrectHorseBatteryStaple1!") => {
    cy.visit("/");
    cy.get('[data-cy="login-email"]').clear().type(email);
    cy.get('[data-cy="login-password"]').clear().type(password);
    cy.get('[data-cy="login-submit"]').click();
  }
);

export {};
