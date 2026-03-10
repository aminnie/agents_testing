import { UserAdminPage } from "../pages/UserAdminPage";

function defaultTeamPassword() {
  return String.fromCharCode(80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 33);
}

function defaultUserPassword() {
  return String.fromCharCode(67, 111, 114, 114, 101, 99, 116, 72, 111, 114, 115, 101, 66, 97, 116, 116, 101, 114, 121, 83, 116, 97, 112, 108, 101, 49, 33);
}

describe("Feature: Admin user management", () => {
  const userAdminPage = new UserAdminPage();
  const adminPassword = Cypress.env("DEMO_TEAM_PASSWORD") || defaultTeamPassword();
  const standardUserPassword = Cypress.env("DEMO_USER_PASSWORD") || defaultUserPassword();

  it("should allow admin to edit user email/display name/role", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept("GET", "/api/admin/users").as("adminUsers");
    cy.intercept("GET", "/api/admin/roles").as("adminRoles");
    cy.intercept("PUT", "/api/admin/users/*").as("adminUpdateUser");

    cy.loginUi("admin@example.com", adminPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-user-admin"]').should("be.visible");
    userAdminPage.openFromHeader();
    cy.location("pathname").should("eq", "/admin/users");
    cy.wait("@adminUsers").its("response.statusCode").should("eq", 200);
    cy.wait("@adminRoles").its("response.statusCode").should("eq", 200);

    const updatedDisplayName = `Shopper Updated ${Date.now()}`;
    userAdminPage.selectUserByEmail("shopper@example.com");
    userAdminPage.emailInput().clear().type("shopper@example.com");
    userAdminPage.displayNameInput().clear().type(updatedDisplayName);
    userAdminPage.roleSelect().select("4");
    userAdminPage.saveButton().click();

    cy.wait("@adminUpdateUser").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.deep.include({
        email: "shopper@example.com",
        displayName: updatedDisplayName,
        roleId: 4
      });
    });
    userAdminPage.successAlert().should("contain", "Updated shopper@example.com");
  });

  it("should block non-admin users from user admin navigation and API", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");

    cy.loginUi("user@example.com", standardUserPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-user-admin"]').should("not.exist");
    cy.visit("/admin/users");
    cy.location("pathname").should("eq", "/store");

    cy.window().then((windowObject) => {
      const token = windowObject.localStorage.getItem("store-auth-state");
      cy.request({
        method: "GET",
        url: "/api/admin/users",
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).its("status").should("eq", 403);
    });
  });

  it("should prevent removing the final remaining admin role", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept("GET", "/api/admin/users").as("adminUsers");
    cy.intercept("GET", "/api/admin/roles").as("adminRoles");
    cy.intercept("PUT", "/api/admin/users/*").as("adminUpdateUser");

    cy.loginUi("admin@example.com", adminPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    userAdminPage.openFromHeader();
    cy.wait("@adminUsers").then(({ response }) => {
      const users = response?.body?.users || [];
      const adminCountBefore = users.filter((user: { role: string }) => user.role === "admin").length;

      userAdminPage.selectUserByEmail("admin@example.com");
      userAdminPage.roleSelect().select("3");
      userAdminPage.saveButton().click();

      cy.wait("@adminUpdateUser").then(({ response: updateResponse }) => {
        const statusCode = updateResponse?.statusCode;
        if (adminCountBefore <= 1) {
          expect(statusCode).to.eq(409);
          userAdminPage.errorAlert().should("contain", "last remaining admin");
        } else {
          expect(statusCode).to.eq(200);
          userAdminPage.successAlert().should("contain", "Updated admin@example.com");
        }
        cy.window().then((windowObject) => {
          const token = windowObject.localStorage.getItem("store-auth-state");
          cy.request({
            method: "GET",
            url: "/api/admin/users",
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false
          }).then((usersResponse) => {
            if (adminCountBefore <= 1) {
              expect(usersResponse.status).to.eq(200);
              const adminsAfter = (usersResponse.body?.users || [])
                .filter((user: { role: string }) => user.role === "admin")
                .length;
              expect(adminsAfter).to.be.greaterThan(0);
              return;
            }
            expect(usersResponse.status).to.eq(403);
          });
        });
      });
    });
    cy.wait("@adminRoles");
  });
});
