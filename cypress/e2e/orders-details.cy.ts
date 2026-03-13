import { CatalogPage } from "../pages/CatalogPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrderDetailsPage } from "../pages/OrderDetailsPage";
import { OrdersPage } from "../pages/OrdersPage";

describe("Feature: Order Details", () => {
  const catalogPage = new CatalogPage();
  const checkoutPage = new CheckoutPage();
  const ordersPage = new OrdersPage();
  const orderDetailsPage = new OrderDetailsPage();

  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.intercept("POST", "/api/checkout").as("checkout");
    cy.intercept("GET", "/api/orders*").as("orders");
    cy.intercept("GET", /\/api\/orders\/[^/]+$/).as("orderDetails");
  });

  it("should open order details from the orders list", () => {
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    checkoutPage.fillAddress("120 Detail Road", "Austin", "78702", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();
    cy.wait("@checkout").its("response.statusCode").should("eq", 201);

    cy.get('[data-cy="nav-store"]').click();
    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@orders").its("response.statusCode").should("eq", 200);
    ordersPage.firstOrderLink().click();

    cy.location("pathname").should("match", /^\/orders\/.+$/);
    cy.wait("@orderDetails").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body?.order).to.have.keys([
        "orderId",
        "createdAt",
        "totalCents",
        "status",
        "shipping",
        "paymentSummary",
        "cancellationReason"
      ]);
      expect(response?.body?.items).to.be.an("array");
    });
    orderDetailsPage.title().should("be.visible");
    orderDetailsPage.orderId().should("contain", "Order #");
    orderDetailsPage.orderStatus().should("contain", "Status:");
    orderDetailsPage.shippingSummary().should("contain", "USA");
    orderDetailsPage.itemsList().should("be.visible");
    orderDetailsPage.backToOrdersButton().click();
    cy.location("pathname").should("eq", "/orders");
  });

  it("should open order details from checkout complete order number link", () => {
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    checkoutPage.fillAddress("500 Checkout Link Ln", "Austin", "73301", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();
    cy.wait("@checkout").its("response.statusCode").should("eq", 201);

    checkoutPage.successMessage().should("contain", "Order confirmed");
    checkoutPage.successOrderLink().should("be.visible").click();
    cy.location("pathname").should("match", /^\/orders\/.+$/);
    cy.wait("@orderDetails").its("response.statusCode").should("eq", 200);
    orderDetailsPage.title().should("be.visible");
  });

  it("should show deterministic not-found state for unknown order id", () => {
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    const missingOrderId = "01012024-99999";
    cy.intercept("GET", `/api/orders/${missingOrderId}`, {
      statusCode: 404,
      body: { message: "Order not found" }
    }).as("missingOrderDetails");

    cy.visit(`/orders/${missingOrderId}`);
    cy.wait("@missingOrderDetails").its("response.statusCode").should("eq", 404);
    orderDetailsPage.errorMessage().should("contain", "Order not found");
  });
});
