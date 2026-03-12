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

  streetInput() {
    return cy.get('[data-cy="register-street"]');
  }

  cityInput() {
    return cy.get('[data-cy="register-city"]');
  }

  postalCodeInput() {
    return cy.get('[data-cy="register-postal-code"]');
  }

  countryInput() {
    return cy.get('[data-cy="register-country"]');
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

  fillForm(
    displayName: string,
    email: string,
    password: string,
    address: { street: string; city: string; postalCode: string; country: string }
  ) {
    this.displayNameInput().clear().type(displayName);
    this.emailInput().clear().type(email);
    this.passwordInput().clear().type(password);
    this.streetInput().clear().type(address.street);
    this.cityInput().clear().type(address.city);
    this.postalCodeInput().clear().type(address.postalCode);
    this.countryInput().clear().type(address.country);
  }

  submit() {
    this.submitButton().click();
  }
}
