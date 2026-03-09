import { CatalogPage } from "../pages/CatalogPage";
import { ProductFormPage } from "../pages/ProductFormPage";

describe("Feature: Catalog editor workflows", () => {
  const catalogPage = new CatalogPage();
  const productFormPage = new ProductFormPage();
  const tooltipText = "Editor role required to manage products.";

  it("should allow editor to create a product from header control", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept("POST", "/api/catalog").as("createCatalogItem");

    cy.loginUi("editor@example.com", "Password123!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-new-product"]').should("be.enabled");
    catalogPage.openNewProductFromHeader();
    cy.location("pathname").should("eq", "/store/product/new");

    productFormPage.fillForm(
      "Editor Created Product",
      "Editor created this catalog item.",
      "2500"
    );
    productFormPage.submit();

    cy.wait("@createCatalogItem").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body).to.deep.include({
        header: "Editor Created Product",
        description: "Editor created this catalog item.",
        priceCents: 2500
      });
    });

    cy.location("pathname").should("eq", "/store");
    cy.get('[data-cy="catalog-list"]').should("contain", "Editor Created Product");
  });

  it("should allow editor to edit a product from catalog and detail controls", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept("PUT", "/api/catalog/*").as("updateCatalogItem");

    cy.loginUi("editor@example.com", "Password123!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.editFirstCatalogItem();
    cy.location("pathname").should("match", /^\/store\/product\/.+\/edit$/);
    productFormPage.fillForm(
      "Editor Updated Product",
      "Updated by editor from catalog view.",
      "3100"
    );
    productFormPage.submit();

    cy.wait("@updateCatalogItem").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.deep.include({
        header: "Editor Updated Product",
        description: "Updated by editor from catalog view.",
        priceCents: 3100
      });
    });

    cy.location("pathname").should("eq", "/store");
    cy.get('[data-cy="catalog-list"]').should("contain", "Editor Updated Product");

    catalogPage.viewFirstCatalogItem();
    cy.location("pathname").should("match", /^\/store\/item\/.+$/);
    cy.get('[data-cy="item-detail-new-product"]').should("be.enabled");
    cy.get('[data-cy="item-detail-edit-product"]').should("be.enabled");
    catalogPage.openEditProductFromDetail();
    cy.location("pathname").should("match", /^\/store\/product\/.+\/edit$/);
  });

  it("should show disabled product controls with tooltip for non-editor users", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");

    cy.loginUi("user@example.com", "CorrectHorseBatteryStaple1!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-new-product"]')
      .should("be.disabled")
      .and("have.attr", "title", tooltipText);
    cy.get('[data-cy="catalog-new-product"]')
      .should("be.disabled")
      .and("have.attr", "title", tooltipText);
    cy.get('[data-cy^="catalog-edit-"]')
      .first()
      .should("be.disabled")
      .and("have.attr", "title", tooltipText);

    catalogPage.viewFirstCatalogItem();
    cy.get('[data-cy="item-detail-new-product"]')
      .should("be.disabled")
      .and("have.attr", "title", tooltipText);
    cy.get('[data-cy="item-detail-edit-product"]')
      .should("be.disabled")
      .and("have.attr", "title", tooltipText);
  });
});
