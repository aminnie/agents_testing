import { LoginPage } from "../pages/LoginPage";

describe("Feature: Login", () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    loginPage.visit();
  });

  it("should show store branding on the login page", () => {
    cy.get('[data-cy="unauth-store-title"]').should("be.visible").and("contain", "Happy Vibes");
    cy.get('[data-cy="nav-brand-store"]').should("not.exist");
    cy.get('[data-cy="login-title"]').should("contain", "Login");
  });

  it("should allow login with valid credentials", () => {
    cy.intercept("POST", "/api/login").as("login");

    loginPage.login("user@example.com", "CorrectHorseBatteryStaple1!");

    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.get('[data-cy="dashboard-title"]').should("be.visible");
  });

  it("should reject invalid credentials", () => {
    cy.intercept("POST", "/api/login").as("login");

    loginPage.login("user@example.com", "wrong-password");

    cy.wait("@login").its("response.statusCode").should("eq", 401);
    cy.get('[data-cy="login-error"]').should("contain", "Invalid email or password");
  });

  it("should show validation for missing fields", () => {
    loginPage.enterEmail("");
    loginPage.enterPassword("");
    loginPage.submit();

    cy.get('[data-cy="login-error"]').should("contain", "Email and password are required");
  });
});
