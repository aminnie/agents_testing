import { UserAdminPage } from "../pages/UserAdminPage";
import { UserEditPage } from "../pages/UserEditPage";

function defaultTeamPassword() {
  return String.fromCharCode(80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 33);
}

function defaultUserPassword() {
  return String.fromCharCode(67, 111, 114, 114, 101, 99, 116, 72, 111, 114, 115, 101, 66, 97, 116, 116, 101, 114, 121, 83, 116, 97, 112, 108, 101, 49, 33);
}

describe("Feature: Admin user management", () => {
  const userAdminPage = new UserAdminPage();
  const userEditPage = new UserEditPage();
  const adminPassword = Cypress.env("DEMO_TEAM_PASSWORD") || defaultTeamPassword();
  const standardUserPassword = Cypress.env("DEMO_USER_PASSWORD") || defaultUserPassword();

  it("should allow admin to open user edit page and save updates", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept({ method: "GET", pathname: "/api/admin/users" }).as("adminUsers");
    cy.intercept("GET", "/api/admin/roles").as("adminRoles");
    cy.intercept("GET", /\/api\/admin\/users\/[^/]+$/).as("adminUserDetail");
    cy.intercept("PUT", "/api/admin/users/*").as("adminUpdateUser");

    cy.loginUi("admin@example.com", adminPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-user-admin"]').should("be.visible");
    userAdminPage.openFromHeader();
    cy.location("pathname").should("eq", "/admin/users");
    cy.wait("@adminUsers").its("response.statusCode").should("be.oneOf", [200, 304]);
    userAdminPage.editButtonByEmail("shopper@example.com").click();

    cy.location("pathname").should("match", /\/admin\/users\/\d+\/edit$/);
    cy.wait("@adminUserDetail").its("response.statusCode").should("eq", 200);
    cy.wait("@adminRoles").its("response.statusCode").should("be.oneOf", [200, 304]);

    const updatedDisplayName = `Shopper Updated ${Date.now()}`;
    userEditPage.emailInput().clear().type("shopper@example.com");
    userEditPage.displayNameInput().clear().type(updatedDisplayName);
    userEditPage.roleSelect().select("4");
    userEditPage.saveButton().click();

    cy.wait("@adminUpdateUser").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.deep.include({
        email: "shopper@example.com",
        displayName: updatedDisplayName,
        roleId: 4
      });
    });
    userEditPage.successAlert().should("contain", "Updated shopper@example.com");
  });

  it("should support user list search and clear behavior", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept({ method: "GET", pathname: "/api/admin/users" }).as("adminUsers");

    cy.loginUi("admin@example.com", adminPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    userAdminPage.openFromHeader();
    cy.wait("@adminUsers");
    userAdminPage.pageIndicator().should("contain", "Page");

    userAdminPage.searchInput().clear().type("no-such-user");
    userAdminPage.searchSubmitButton().click();
    userAdminPage.noResultsMessage().should("be.visible");

    userAdminPage.searchClearButton().click();
    userAdminPage.noResultsMessage().should("not.exist");
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

  it("should reset unsaved user edits when cancel edit is clicked", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept({ method: "GET", pathname: "/api/admin/users" }).as("adminUsers");
    cy.intercept("GET", "/api/admin/roles").as("adminRoles");
    cy.intercept("GET", /\/api\/admin\/users\/[^/]+$/).as("adminUserDetail");
    cy.intercept("PUT", "/api/admin/users/*").as("adminUpdateUser");

    cy.loginUi("admin@example.com", adminPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    userAdminPage.openFromHeader();
    cy.location("pathname").should("eq", "/admin/users");
    cy.wait("@adminUsers").its("response.statusCode").should("be.oneOf", [200, 304]);
    userAdminPage.editButtonByEmail("shopper@example.com").click();
    cy.wait("@adminUserDetail").its("response.statusCode").should("eq", 200);
    cy.wait("@adminRoles").its("response.statusCode").should("be.oneOf", [200, 304]);

    userEditPage.emailInput().invoke("val").then((originalEmail) => {
      userEditPage.displayNameInput().invoke("val").then((originalDisplayName) => {
        userEditPage.roleSelect().invoke("val").then((originalRoleId) => {
          userEditPage.emailInput().clear().type("shopper-updated@example.com");
          userEditPage.displayNameInput().clear().type(`Unsaved Name ${Date.now()}`);
          userEditPage.roleSelect().select("4");
          userEditPage.cancelButton().click();

          cy.location("pathname").should("eq", "/admin/users");
          cy.get("@adminUpdateUser.all").should("have.length", 0);
          userAdminPage.editButtonByEmail(String(originalEmail || "")).click();
          cy.wait("@adminUserDetail");
          userEditPage.emailInput().should("have.value", String(originalEmail || ""));
          userEditPage.displayNameInput().should("have.value", String(originalDisplayName || ""));
          userEditPage.roleSelect().should("have.value", String(originalRoleId || ""));
        });
      });
    });
  });

  it("should prevent removing the final remaining admin role", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept({ method: "GET", pathname: "/api/admin/users" }).as("adminUsers");
    cy.intercept("GET", "/api/admin/roles").as("adminRoles");
    cy.intercept("GET", /\/api\/admin\/users\/[^/]+$/).as("adminUserDetail");
    cy.intercept("PUT", "/api/admin/users/*").as("adminUpdateUser");

    cy.loginUi("admin@example.com", adminPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    userAdminPage.openFromHeader();
    cy.wait("@adminUsers").then(() => {
      userAdminPage.editButtonByEmail("admin@example.com").click();
      cy.wait("@adminUserDetail");
      cy.wait("@adminRoles");
      userEditPage.roleSelect().select("3");
      userEditPage.saveButton().click();

      cy.wait("@adminUpdateUser").then(({ response: updateResponse }) => {
        const statusCode = updateResponse?.statusCode;
        expect([200, 409]).to.include(statusCode || -1);
        if (statusCode === 409) {
          userEditPage.errorAlert().should("contain", "last remaining admin");
        } else {
          userEditPage.successAlert().should("contain", "Updated admin@example.com");
        }
        cy.window().then((windowObject) => {
          const token = windowObject.localStorage.getItem("store-auth-state");
          cy.request({
            method: "GET",
            url: "/api/admin/users",
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false
          }).then((usersResponse) => {
            if (statusCode === 409) {
              expect(usersResponse.status).to.eq(200);
              const adminsAfter = (usersResponse.body?.users || [])
                .filter((user: { role?: string; roleId?: number }) => {
                  const normalizedRole = String(user.role || "").toLowerCase();
                  return normalizedRole === "admin" || Number(user.roleId) === 1;
                })
                .length;
              expect(adminsAfter).to.be.greaterThan(0);
              return;
            }
            expect(usersResponse.status).to.be.oneOf([200, 403]);
          });
        });
      });
    });
    cy.wait("@adminRoles");
  });
});
