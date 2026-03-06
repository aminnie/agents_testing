describe("Feature: Session management", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
  });

  it("should persist user session after page reload", () => {
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.reload();
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="dashboard-title"]').should("be.visible");
    cy.get('[data-cy="session-user-email"]').should("contain", "user@example.com");
  });

  it("should clear session and remain logged out after logout", () => {
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="logout-button"]').click();
    cy.get('[data-cy="login-title"]').should("be.visible");
    cy.get('[data-cy="login-password"]').should("have.value", "");

    cy.window().then((windowObject) => {
      expect(windowObject.localStorage.getItem("store_token")).to.equal(null);
      expect(windowObject.localStorage.getItem("store_user")).to.equal(null);
    });

    cy.reload();
    cy.get('[data-cy="login-title"]').should("be.visible");
    cy.get('[data-cy="dashboard-title"]').should("not.exist");
  });
});
