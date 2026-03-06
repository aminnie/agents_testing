export class LoginPage {
  visit() {
    cy.visit("/");
  }

  enterEmail(email: string) {
    cy.get('[data-cy="login-email"]').clear().then(($input) => {
      if (email.length > 0) {
        cy.wrap($input).type(email);
      }
    });
  }

  enterPassword(password: string) {
    cy.get('[data-cy="login-password"]').clear().then(($input) => {
      if (password.length > 0) {
        cy.wrap($input).type(password);
      }
    });
  }

  submit() {
    cy.get('[data-cy="login-submit"]').click();
  }

  login(email: string, password: string) {
    this.enterEmail(email);
    this.enterPassword(password);
    this.submit();
  }
}
