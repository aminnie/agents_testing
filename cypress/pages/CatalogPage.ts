export class CatalogPage {
  addFirstCatalogItem() {
    cy.get('[data-cy^="catalog-add-"]').first().click();
  }

  viewFirstCatalogItem() {
    cy.get('[data-cy^="catalog-view-"]').first().click();
  }

  addFromDetailAndReturn() {
    cy.get('[data-cy="item-detail-add-and-return"]').click();
  }

  returnFromDetail() {
    cy.get('[data-cy="item-detail-return"]').click();
  }

  cartTotal() {
    return cy.get('[data-cy="cart-total"]');
  }

  cartItemList() {
    return cy.get('[data-cy="cart-list"]');
  }
}
