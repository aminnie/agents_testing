import { CheckoutPage } from "../pages/CheckoutPage";
import { CatalogPage } from "../pages/CatalogPage";

describe("Feature: Checkout", () => {
  const checkoutPage = new CheckoutPage();
  const catalogPage = new CatalogPage();
  const publicOrderIdPattern = /^[0-1][0-9][0-3][0-9][0-9]{4}-[0-9]{5}$/;

  function assertCheckoutResponseSuccess(response: Cypress.Response<any> | undefined) {
    expect(response?.statusCode).to.eq(201);
    expect(response?.body?.orderId).to.match(publicOrderIdPattern);
  }

  function assertCheckoutSuccessOnlyMessage() {
    checkoutPage.successMessage().should("contain", "Order confirmed");
    cy.get('[data-cy="checkout-form"]').should("not.exist");
    cy.get('[data-cy="checkout-name"]').should("not.exist");
    cy.get('[data-cy="checkout-card"]').should("not.exist");
    cy.get('[data-cy="nav-checkout"]').should("be.disabled");
    cy.get('[data-cy="nav-cart-count"]').should("contain", "0");
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
    checkoutPage.fillAddress("101 Test Street", "Austin", "73301", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();

    cy.wait("@checkout").then(({ request, response }) => {
      assertCheckoutResponseSuccess(response);
      expect(request.body.address).to.deep.equal({
        street: "101 Test Street",
        city: "Austin",
        postalCode: "73301",
        country: "USA"
      });
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
    checkoutPage.fillAddress("101 Test Street", "Austin", "73301", "USA");
    checkoutPage.submit();

    checkoutPage.errorMessage().should("contain", "Payment details are required");
  });

  it("should normalize card number input with spaces and hyphens", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.location("pathname").should("eq", "/checkout");

    checkoutPage.fillAddress("101 Test Street", "Austin", "73301", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242 4242-4242 4242");
    checkoutPage.submit();

    cy.wait("@checkout").then(({ request, response }) => {
      assertCheckoutResponseSuccess(response);
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

    checkoutPage.fillAddress("101 Test Street", "Austin", "73301", "USA");
    checkoutPage.fillPayment("Anton Minnie", "12345");
    checkoutPage.submit();

    cy.wait("@checkout").then(({ request, response }) => {
      assertCheckoutResponseSuccess(response);
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

    checkoutPage.fillAddress("101 Test Street", "Austin", "73301", "USA");
    checkoutPage.fillPayment("Anton Minnie", "1234");
    checkoutPage.submit();

    checkoutPage.errorMessage().should("contain", "Payment details are required");
  });

  it("should persist edited address and prefill on later checkout", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    checkoutPage.fillAddress("900 Persist Lane", "Denver", "80202", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();
    cy.wait("@checkout").its("response.statusCode").should("eq", 201);
    assertCheckoutSuccessOnlyMessage();

    cy.get('[data-cy="nav-store"]').click();
    cy.location("pathname").should("eq", "/store");
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.location("pathname").should("eq", "/checkout");
    cy.get('[data-cy="checkout-street"]').should("have.value", "900 Persist Lane");
    cy.get('[data-cy="checkout-city"]').should("have.value", "Denver");
    cy.get('[data-cy="checkout-postal-code"]').should("have.value", "80202");
    cy.get('[data-cy="checkout-country"]').should("have.value", "USA");
  });

  it("should block checkout when postal code is invalid", () => {
    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    checkoutPage.fillAddress("101 Test Street", "Austin", "ABC", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();

    cy.get("@checkout.all").should("have.length", 0);
    checkoutPage.errorMessage().should("contain", "Postal code");
  });
});
