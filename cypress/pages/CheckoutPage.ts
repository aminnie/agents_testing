export class CheckoutPage {
  fillAddress(street: string, city: string, postalCode: string, country: string) {
    cy.get('[data-cy="checkout-street"]').clear().type(street);
    cy.get('[data-cy="checkout-city"]').clear().type(city);
    cy.get('[data-cy="checkout-postal-code"]').clear().type(postalCode);
    cy.get('[data-cy="checkout-country"]').clear().type(country);
  }

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

  successOrderLink() {
    return cy.get('[data-cy="checkout-order-link"]');
  }

  errorMessage() {
    return cy.get('[data-cy="checkout-error"]');
  }

  firstItemQuantity() {
    return cy.get('[data-cy^="checkout-item-quantity-"]').first();
  }

  incrementFirstItem() {
    cy.get('[data-cy^="checkout-item-inc-"]').first().click();
  }

  decrementFirstItem() {
    cy.get('[data-cy^="checkout-item-dec-"]').first().click();
  }

  deleteFirstItem() {
    cy.get('[data-cy^="checkout-item-delete-"]').first().click();
  }
}
