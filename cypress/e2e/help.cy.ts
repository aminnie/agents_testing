describe("Feature: Help", () => {
  it("should show guidance content and hide demo user listing on the help page", () => {
    cy.intercept("GET", "/api/help").as("help");

    cy.visit("/help");
    cy.wait("@help").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="unauth-store-title"]').should("be.visible").and("contain", "Good Vibes");
    cy.get('[data-cy="help-page-title"]').should("contain", "Help");
    cy.get('[data-cy="help-demo-users"]').should("not.exist");
    cy.get('[data-cy="help-navigation-tips"] li').should("have.length.at.least", 4);
    cy.get('[data-cy="help-navigation-tips"]').should("contain", "Admin users can manage user roles");
  });

  it("should show graceful error state when help API fails", () => {
    cy.intercept("GET", "/api/help", {
      statusCode: 500,
      body: { message: "Unable to load help information" }
    }).as("helpFailure");

    cy.visit("/help");
    cy.wait("@helpFailure");
    cy.get('[data-cy="help-page-error"]').should("be.visible");
    cy.get('[data-cy="help-page-error"]').should("contain", "Unable to load help information right now.");
  });

  it("should allow navigation to help from login and authenticated header", () => {
    cy.intercept("GET", "/api/help").as("helpFromLogin");
    cy.visit("/");
    cy.get('[data-cy="login-help"]').click();
    cy.location("pathname").should("eq", "/help");
    cy.wait("@helpFromLogin").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('[data-cy="unauth-store-title"]').should("be.visible");
    cy.get('[data-cy="nav-brand-store"]').should("not.exist");
    cy.get('[data-cy="dashboard-title"]').should("not.exist");

    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept("GET", "/api/help").as("helpFromHeader");

    cy.visit("/");
    cy.get('[data-cy="login-email"]').clear().type("user@example.com");
    cy.get('[data-cy="login-password"]').clear().type("CorrectHorseBatteryStaple1!");
    cy.get('[data-cy="login-submit"]').click();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-help"]').click();
    cy.location("pathname").should("eq", "/help");
    cy.wait("@helpFromHeader").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('[data-cy="dashboard-title"]').should("be.visible");
    cy.get('[data-cy="unauth-store-title"]').should("not.exist");
    cy.get('[data-cy="nav-brand-store"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/store");
  });
});
