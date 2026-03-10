declare global {
  namespace Cypress {
    interface Chainable {
      loginUi(email?: string, password?: string): Chainable<void>;
      injectAxe(): Chainable<void>;
      checkA11y(
        context?: string | Node | null,
        options?: Record<string, unknown>,
        violationCallback?: (violations: unknown[]) => void,
        skipFailures?: boolean
      ): Chainable<void>;
      task(event: string, arg?: unknown): Chainable<unknown>;
    }
  }
}

Cypress.Commands.add(
  "loginUi",
  (
    email = "user@example.com",
    password = Cypress.env("DEFAULT_LOGIN_PASSWORD")
      || String.fromCharCode(67, 111, 114, 114, 101, 99, 116, 72, 111, 114, 115, 101, 66, 97, 116, 116, 101, 114, 121, 83, 116, 97, 112, 108, 101, 49, 33)
  ) => {
    cy.visit("/");
    cy.get('[data-cy="login-email"]').clear().type(email);
    cy.get('[data-cy="login-password"]').clear().type(password);
    cy.get('[data-cy="login-submit"]').click();
  }
);

export {};
