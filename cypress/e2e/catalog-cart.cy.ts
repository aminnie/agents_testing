import { CatalogPage } from "../pages/CatalogPage";

describe("Feature: Catalog and Cart", () => {
  const catalogPage = new CatalogPage();

  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
  });

  it("should display catalog items after login", () => {
    cy.get('[data-cy="catalog-list"] li').should("have.length", 10);
  });

  it("should add an item to cart and update total", () => {
    cy.get('[data-cy="nav-checkout"]').should("not.exist");
    catalogPage.navCartCount().should("contain", "0");
    catalogPage.addFirstCatalogItem();
    catalogPage.navCartCount().should("contain", "1");
  });

  it("should navigate from store to checkout page", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="nav-checkout"]').should("not.exist");

    catalogPage.openCheckoutFromHeader();
    cy.location("pathname").should("eq", "/checkout");
    cy.get('[data-cy="checkout-page-title"]').should("be.visible");
  });

  it("should open item details and add item to cart before returning to store", () => {
    catalogPage.viewFirstCatalogItem();
    cy.location("pathname").should("match", /^\/store\/item\/.+$/);
    cy.get('[data-cy="item-detail-page"]').should("be.visible");
    cy.get('[data-cy="item-detail-header"]').should("not.be.empty");
    cy.get('[data-cy="item-detail-description"]').should("not.be.empty");

    catalogPage.addFromDetailAndReturn();
    cy.location("pathname").should("eq", "/store");
    cy.get('[data-cy="nav-checkout"]').should("not.exist");
    catalogPage.navCartCount().should("contain", "1");
  });

  it("should return from item details without adding an item", () => {
    catalogPage.navCartCount().should("contain", "0");
    catalogPage.viewFirstCatalogItem();
    cy.location("pathname").should("match", /^\/store\/item\/.+$/);

    catalogPage.returnFromDetail();
    cy.location("pathname").should("eq", "/store");
    cy.get('[data-cy="nav-checkout"]').should("not.exist");
    catalogPage.navCartCount().should("contain", "0");
  });

  it("should re-enable top checkout button after adding an item again", () => {
    catalogPage.addFirstCatalogItem();
    catalogPage.navCartCount().should("contain", "1");
    catalogPage.openCheckoutFromHeader();

    cy.get('[data-cy="checkout-street"]').type("101 Test Street");
    cy.get('[data-cy="checkout-city"]').type("Austin");
    cy.get('[data-cy="checkout-postal-code"]').type("73301");
    cy.get('[data-cy="checkout-country"]').type("USA");
    cy.get('[data-cy="checkout-name"]').type("Anton Minnie");
    cy.get('[data-cy="checkout-card"]').type("12345");
    cy.get('[data-cy="checkout-submit"]').click();
    cy.get('[data-cy="nav-checkout"]').should("not.exist");
    catalogPage.navCartCount().should("contain", "0");

    cy.get('[data-cy="nav-store"]').click();
    cy.location("pathname").should("eq", "/store");
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="nav-checkout"]').should("not.exist");
    catalogPage.navCartCount().should("contain", "1");
  });
});
