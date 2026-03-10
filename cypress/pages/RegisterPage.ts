export class RegisterPage {
  displayNameInput() {
    return cy.get('[data-cy="register-display-name"]');
  }

  emailInput() {
    return cy.get('[data-cy="register-email"]');
  }

  passwordInput() {
    return cy.get('[data-cy="register-password"]');
  }

  submitButton() {
    return cy.get('[data-cy="register-submit"]');
  }

  errorAlert() {
    return cy.get('[data-cy="register-error"]');
  }

  backToLoginButton() {
    return cy.get('[data-cy="register-login-link"]');
  }

  fillForm(displayName: string, email: string, password: string) {
    this.displayNameInput().clear().type(displayName);
    this.emailInput().clear().type(email);
    this.passwordInput().clear().type(password);
  }

  submit() {
    this.submitButton().click();
  }
}
