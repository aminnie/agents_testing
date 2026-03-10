import { RegisterPage } from "../pages/RegisterPage";

describe("Feature: Self registration", () => {
  const registerPage = new RegisterPage();

  it("should navigate from login page to registration page", () => {
    cy.visit("/");
    cy.get('[data-cy="login-register-link"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/register");
    cy.get('[data-cy="register-title"]').should("be.visible");
  });

  it("should auto-login after successful registration", () => {
    const uniqueEmail = `new-user-${Date.now()}@example.com`;
    const uniquePassword = `pw-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    cy.intercept("POST", "/api/register").as("register");
    cy.intercept("GET", "/api/catalog").as("catalog");

    cy.visit("/register");
    registerPage.fillForm("New User", uniqueEmail, uniquePassword);
    registerPage.submit();

    cy.wait("@register").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body).to.deep.include({
        displayName: "New User",
        email: uniqueEmail,
        password: uniquePassword
      });
    });

    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.location("pathname").should("eq", "/store");
    cy.get('[data-cy="session-user-email"]').should("contain", uniqueEmail);
  });

  it("should reject duplicate email registration", () => {
    const uniquePassword = `pw-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    cy.intercept("POST", "/api/register").as("register");

    cy.visit("/register");
    registerPage.fillForm("Existing User", "user@example.com", uniquePassword);
    registerPage.submit();

    cy.wait("@register").its("response.statusCode").should("eq", 409);
    registerPage.errorAlert().should("contain", "already exists");
    cy.location("pathname").should("eq", "/register");
  });
});
