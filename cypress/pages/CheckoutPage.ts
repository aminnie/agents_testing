export class CheckoutPage {
  fillPayment(name: string, cardNumber: string) {
    cy.get('[data-cy="checkout-name"]').clear().type(name);
    cy.get('[data-cy="checkout-card"]').clear().type(cardNumber);
  }

  submit() {
    cy.get('[data-cy="checkout-submit"]').click();
  }

  successMessage() {
    return cy.get('[data-cy="checkout-success"]');
  }

  errorMessage() {
    return cy.get('[data-cy="checkout-error"]');
  }
}
