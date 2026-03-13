import { CatalogPage } from "../pages/CatalogPage";
import { ProductFormPage } from "../pages/ProductFormPage";

describe("Feature: Catalog editor workflows", () => {
  const catalogPage = new CatalogPage();
  const productFormPage = new ProductFormPage();
  const formatPriceLabel = (priceCents: number) => `Price: $${(priceCents / 100).toFixed(2)}`;

  it("should allow editor to create a product from header control", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.intercept("POST", "/api/catalog").as("createCatalogItem");

    cy.loginUi("editor@example.com", "Password123!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-new-product"]').should("be.enabled");
    catalogPage.openNewProductFromHeader();
    cy.location("pathname", { timeout: 10000 }).should("eq", "/store/product/new");

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
    cy.intercept("GET", "/api/catalog*").as("catalog");
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

  it("should allow manager to create and edit products", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.intercept("POST", "/api/catalog").as("createCatalogItem");
    cy.intercept("PUT", "/api/catalog/*").as("updateCatalogItem");

    cy.loginUi("manager@example.com", "Password123!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-new-product"]').should("be.visible");
    catalogPage.openNewProductFromHeader();
    cy.location("pathname", { timeout: 10000 }).should("eq", "/store/product/new");

    productFormPage.fillForm(
      "Manager Created Product",
      "Manager created this catalog item.",
      "2600"
    );
    productFormPage.submit();
    cy.wait("@createCatalogItem").its("response.statusCode").should("eq", 201);
    cy.location("pathname").should("eq", "/store");

    catalogPage.editFirstCatalogItem();
    productFormPage.fillForm(
      "Manager Updated Product",
      "Updated by manager from catalog view.",
      "3200"
    );
    productFormPage.submit();
    cy.wait("@updateCatalogItem").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/store");
  });

  it("should persist editor updates after page refresh from catalog and detail paths", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.intercept("PUT", "/api/catalog/*").as("updateCatalogItem");

    const stamp = Date.now();
    const firstUpdate = {
      header: `Editor Persist A ${stamp}`,
      description: `Updated from catalog ${stamp}`,
      priceCents: 4100
    };
    const secondUpdate = {
      header: `Editor Persist B ${stamp}`,
      description: `Updated from detail ${stamp}`,
      priceCents: 4200
    };

    cy.loginUi("editor@example.com", "Password123!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.editFirstCatalogItem();
    productFormPage.fillForm(firstUpdate.header, firstUpdate.description, String(firstUpdate.priceCents));
    productFormPage.submit();
    cy.wait("@updateCatalogItem").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/store");
    cy.get('[data-cy="catalog-list"]').should("contain", firstUpdate.header);

    catalogPage.viewFirstCatalogItem();
    cy.location("pathname").should("match", /^\/store\/item\/.+$/);
    cy.get('[data-cy="item-detail-header"]').should("contain", firstUpdate.header);
    cy.get('[data-cy="item-detail-description"]').should("contain", firstUpdate.description);
    cy.get('[data-cy="item-detail-price"]').should("have.text", formatPriceLabel(firstUpdate.priceCents));

    cy.reload();
    cy.get('[data-cy="item-detail-header"]').should("contain", firstUpdate.header);
    cy.get('[data-cy="item-detail-description"]').should("contain", firstUpdate.description);
    cy.get('[data-cy="item-detail-price"]').should("have.text", formatPriceLabel(firstUpdate.priceCents));

    catalogPage.openEditProductFromDetail();
    productFormPage.fillForm(secondUpdate.header, secondUpdate.description, String(secondUpdate.priceCents));
    productFormPage.submit();
    cy.wait("@updateCatalogItem").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/store");

    cy.get('[data-cy="catalog-list"]').should("contain", secondUpdate.header);
    catalogPage.viewFirstCatalogItem();
    cy.get('[data-cy="item-detail-header"]').should("contain", secondUpdate.header);
    cy.get('[data-cy="item-detail-description"]').should("contain", secondUpdate.description);
    cy.get('[data-cy="item-detail-price"]').should("have.text", formatPriceLabel(secondUpdate.priceCents));
    cy.reload();
    cy.get('[data-cy="item-detail-header"]').should("contain", secondUpdate.header);
    cy.get('[data-cy="item-detail-description"]').should("contain", secondUpdate.description);
    cy.get('[data-cy="item-detail-price"]').should("have.text", formatPriceLabel(secondUpdate.priceCents));
  });

  it("should hide product controls for non-manager and non-editor users", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");

    cy.loginUi("user@example.com", "CorrectHorseBatteryStaple1!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-new-product"]').should("not.exist");
    cy.get('[data-cy="catalog-new-product"]').should("not.exist");
    cy.get('[data-cy^="catalog-edit-"]').should("have.length", 0);

    catalogPage.viewFirstCatalogItem();
    cy.get('[data-cy="item-detail-new-product"]').should("not.exist");
    cy.get('[data-cy="item-detail-edit-product"]').should("not.exist");
  });

  it("should hide product controls for admin users", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");

    cy.loginUi("admin@example.com", "Password123!");
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-new-product"]').should("not.exist");
    cy.get('[data-cy="catalog-new-product"]').should("not.exist");
    cy.get('[data-cy^="catalog-edit-"]').should("have.length", 0);

    catalogPage.viewFirstCatalogItem();
    cy.get('[data-cy="item-detail-new-product"]').should("not.exist");
    cy.get('[data-cy="item-detail-edit-product"]').should("not.exist");
  });
});
