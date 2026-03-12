import { CatalogPage } from "../pages/CatalogPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrdersPage } from "../pages/OrdersPage";

describe("Feature: Orders List", () => {
  const catalogPage = new CatalogPage();
  const checkoutPage = new CheckoutPage();
  const ordersPage = new OrdersPage();

  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.intercept("POST", "/api/checkout").as("checkout");
  });

  it("should list previous orders for the authenticated user with header-only fields", () => {
    cy.intercept("GET", "/api/orders").as("orders");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    checkoutPage.fillAddress("500 Orders Lane", "Austin", "73301", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();

    let createdOrderId = "";
    cy.wait("@checkout").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      createdOrderId = String(response?.body?.orderId || "");
      expect(createdOrderId).to.not.equal("");
    });

    cy.get('[data-cy="nav-store"]').click();
    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    ordersPage.title().should("be.visible");
    cy.wait("@orders").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const returnedOrders = response?.body?.orders || [];
      expect(returnedOrders.length).to.be.greaterThan(0);
      expect(returnedOrders[0].orderId).to.eq(createdOrderId);
      expect(returnedOrders[0]).to.have.keys(["orderId", "createdAt", "totalCents"]);
    });

    cy.get('[data-cy^="orders-id-"]').first().should("contain", createdOrderId);
    cy.get('[data-cy^="orders-item-"]').should("have.length.at.least", 1);
  });

  it("should show an empty-state message when no previous orders exist", () => {
    cy.intercept("GET", "/api/orders", {
      statusCode: 200,
      body: { orders: [] }
    }).as("orders");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@orders").its("response.statusCode").should("eq", 200);
    ordersPage.emptyState().should("contain", "No previous orders");
  });

  it("should show a deterministic error message when orders request fails", () => {
    cy.intercept("GET", "/api/orders", {
      statusCode: 500,
      body: { message: "Could not load orders" }
    }).as("orders");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@orders").its("response.statusCode").should("eq", 500);
    ordersPage.errorMessage().should("contain", "Could not load orders");
  });
});
