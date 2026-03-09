export class CatalogPage {
  addFirstCatalogItem() {
    cy.get('[data-cy^="catalog-add-"]').first().click();
  }

  editFirstCatalogItem() {
    cy.get('[data-cy^="catalog-edit-"]').first().click();
  }

  viewFirstCatalogItem() {
    cy.get('[data-cy^="catalog-view-"]').first().click();
  }

  openNewProductFromCatalog() {
    cy.get('[data-cy="catalog-new-product"]').click();
  }

  openNewProductFromHeader() {
    cy.get('[data-cy="nav-new-product"]').click();
  }

  addFromDetailAndReturn() {
    cy.get('[data-cy="item-detail-add-and-return"]').click();
  }

  openNewProductFromDetail() {
    cy.get('[data-cy="item-detail-new-product"]').click();
  }

  openEditProductFromDetail() {
    cy.get('[data-cy="item-detail-edit-product"]').click();
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
