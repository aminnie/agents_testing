export class OrderDetailsPage {
  title() {
    return cy.get('[data-cy="order-details-page-title"]');
  }

  orderId() {
    return cy.get('[data-cy="order-details-id"]');
  }

  orderTotal() {
    return cy.get('[data-cy="order-details-total"]');
  }

  orderStatus() {
    return cy.get('[data-cy="order-details-status"]');
  }

  shippingSummary() {
    return cy.get('[data-cy="order-details-shipping"]');
  }

  paymentSummary() {
    return cy.get('[data-cy="order-details-payment"]');
  }

  itemsList() {
    return cy.get('[data-cy="order-details-items-list"]');
  }

  errorMessage() {
    return cy.get('[data-cy="order-details-error"]');
  }

  backToOrdersButton() {
    return cy.get('[data-cy="order-details-back-to-orders"]');
  }
}
