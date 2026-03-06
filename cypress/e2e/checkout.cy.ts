import { CheckoutPage } from "../pages/CheckoutPage";
import { CatalogPage } from "../pages/CatalogPage";

describe("Feature: Checkout", () => {
  const checkoutPage = new CheckoutPage();
  const catalogPage = new CatalogPage();

  function assertCheckoutSuccessOnlyMessage() {
    checkoutPage.successMessage().should("contain", "Order confirmed");
    cy.get('[data-cy="checkout-form"]').should("not.exist");
    cy.get('[data-cy="checkout-name"]').should("not.exist");
    cy.get('[data-cy="checkout-card"]').should("not.exist");
    cy.get('[data-cy="nav-checkout"]').should("be.disabled");
  }

  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept("POST", "/api/checkout").as("checkout");

    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
  });

  it("should complete checkout for cart items", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.location("pathname").should("eq", "/checkout");
    cy.get('[data-cy="checkout-page-title"]').should("be.visible");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();

    cy.wait("@checkout").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.payment).to.deep.include({
        nameOnCard: "Anton Minnie",
        cardNumber: "4242424242424242"
      });
    });
    assertCheckoutSuccessOnlyMessage();
  });

  it("should block checkout when payment is incomplete", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.location("pathname").should("eq", "/checkout");
    checkoutPage.submit();

    checkoutPage.errorMessage().should("contain", "Payment details are required");
  });

  it("should normalize card number input with spaces and hyphens", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.location("pathname").should("eq", "/checkout");

    checkoutPage.fillPayment("Anton Minnie", "4242 4242-4242 4242");
    checkoutPage.submit();

    cy.wait("@checkout").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.payment).to.deep.include({
        nameOnCard: "Anton Minnie",
        cardNumber: "4242424242424242"
      });
    });
    assertCheckoutSuccessOnlyMessage();
  });

  it("should allow card numbers longer than four digits", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.location("pathname").should("eq", "/checkout");

    checkoutPage.fillPayment("Anton Minnie", "12345");
    checkoutPage.submit();

    cy.wait("@checkout").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.payment).to.deep.include({
        nameOnCard: "Anton Minnie",
        cardNumber: "12345"
      });
    });
    assertCheckoutSuccessOnlyMessage();
  });

  it("should reject card numbers with four or fewer digits", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.location("pathname").should("eq", "/checkout");

    checkoutPage.fillPayment("Anton Minnie", "1234");
    checkoutPage.submit();

    checkoutPage.errorMessage().should("contain", "Payment details are required");
  });
});
