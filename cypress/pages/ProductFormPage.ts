export class ProductFormPage {
  headerInput() {
    return cy.get('[data-cy="product-form-header"]');
  }

  descriptionInput() {
    return cy.get('[data-cy="product-form-description"]');
  }

  priceInput() {
    return cy.get('[data-cy="product-form-price"]');
  }

  submitButton() {
    return cy.get('[data-cy="product-form-submit"]');
  }

  fillForm(header: string, description: string, priceCents: string) {
    this.headerInput().clear().type(header);
    this.descriptionInput().clear().type(description);
    this.priceInput().clear().type(priceCents);
  }

  submit() {
    this.submitButton().click();
  }
}
