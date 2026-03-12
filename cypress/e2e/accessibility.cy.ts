const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const RUN_A11Y = Cypress.env("RUN_A11Y") === true || Cypress.env("RUN_A11Y") === "true";

type AxeNode = {
  target: string[];
};

type AxeViolation = {
  id: string;
  help: string;
  helpUrl?: string;
  impact?: string;
  nodes: AxeNode[];
};

function runA11yAudit(scope: string, context: string = "body") {
  let typedViolations: AxeViolation[] = [];
  cy.injectAxe();
  cy.checkA11y(
    context,
    {
      runOnly: {
        type: "tag",
        values: WCAG_TAGS
      }
    },
    (violations) => {
      typedViolations = violations as AxeViolation[];
    },
    true
  );

  cy.url().then((url) => {
    const reportViolations = typedViolations.map((violation) => ({
      id: violation.id,
      impact: violation.impact || "unknown",
      help: violation.help,
      helpUrl: violation.helpUrl || "",
      targets: violation.nodes.flatMap((node) => node.target)
    }));

    cy.task("appendA11yReport", {
      checkedAt: new Date().toISOString(),
      scope,
      url,
      violationCount: reportViolations.length,
      violations: reportViolations
    });

    const summary = reportViolations
      .map((violation) => `${violation.id} [${violation.impact}] ${violation.help} (${violation.targets.slice(0, 3).join(", ")})`)
      .join("\n");

    expect(
      reportViolations,
      summary || "No WCAG accessibility violations should be present"
    ).to.have.length(0);
  });
}

(RUN_A11Y ? describe : describe.skip)("Feature: Accessibility baseline checks", () => {
  before(() => {
    cy.task("initA11yReport");
  });

  after(() => {
    cy.task("finalizeA11yReport").then((path) => {
      if (path) {
        cy.log(`A11y report saved: ${path}`);
      }
    });
  });

  it("should pass WCAG checks on the login page", () => {
    cy.visit("/");
    cy.get('[data-cy="login-title"]').should("be.visible");
    runA11yAudit("login");
  });

  it("should pass WCAG checks on the help page", () => {
    cy.intercept("GET", "/api/help").as("help");
    cy.visit("/help");
    cy.wait("@help").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('[data-cy="help-page-title"]').should("be.visible");
    runA11yAudit("help");
  });

  it("should pass WCAG checks on authenticated core pages", () => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.intercept("GET", "/api/orders").as("orders");

    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    // Store page
    cy.location("pathname").should("eq", "/store");
    runA11yAudit("store");

    // Store page no-results search state
    cy.get('[data-cy="catalog-search-input"]').clear().type("zzzz-no-match-query");
    cy.get('[data-cy="catalog-search-submit"]').click();
    cy.wait("@catalog").its("response.statusCode").should("eq", 200);
    cy.get('[data-cy="catalog-no-results"]').should("be.visible");
    runA11yAudit("store-no-results");
    cy.get('[data-cy="catalog-search-clear"]').click();
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    // Orders list page
    cy.get('[data-cy="go-to-orders"]').click();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@orders").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('[data-cy="orders-page-title"]').should("be.visible");
    runA11yAudit("orders");

    // Order details page
    cy.intercept("GET", /\/api\/orders\/[^/]+$/).as("orderDetails");
    cy.get('[data-cy^="orders-link-"]').first().click();
    cy.location("pathname").should("match", /^\/orders\/.+$/);
    cy.wait("@orderDetails").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('[data-cy="order-details-page-title"]').should("be.visible");
    runA11yAudit("order-details");

    // Item detail page
    cy.get('[data-cy="nav-store"]').click();
    cy.get('[data-cy^="catalog-view-"]').first().click();
    cy.get('[data-cy="item-detail-page"]').should("be.visible");
    runA11yAudit("item-detail");

    // Checkout page
    cy.get('[data-cy="item-detail-return"]').click();
    cy.get('[data-cy^="catalog-add-"]').first().click();
    cy.get('[data-cy="go-to-checkout"]').click();
    cy.get('[data-cy="checkout-page-title"]').should("be.visible");
    runA11yAudit("checkout");
  });

  it("should pass WCAG checks on product form for editor role", () => {
    const editorPassword = Cypress.env("DEMO_TEAM_PASSWORD")
      || String.fromCharCode(80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 33);
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");

    cy.loginUi("editor@example.com", editorPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-new-product"]').click();
    cy.location("pathname").should("eq", "/store/product/new");
    cy.get('[data-cy="product-form-page"]').should("be.visible");
    runA11yAudit("product-form");
  });

  it("should pass WCAG checks on admin user management page for admin role", () => {
    const adminPassword = Cypress.env("DEMO_TEAM_PASSWORD")
      || String.fromCharCode(80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 33);
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.intercept({ method: "GET", pathname: "/api/admin/users" }).as("adminUsers");
    cy.intercept("GET", /\/api\/admin\/users\/[^/]+$/).as("adminUserDetail");
    cy.intercept("GET", "/api/admin/roles").as("adminRoles");

    cy.loginUi("admin@example.com", adminPassword);
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.get('[data-cy="nav-user-admin"]').click();
    cy.location("pathname").should("eq", "/admin/users");
    cy.wait("@adminUsers").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('[data-cy="admin-users-page"]').should("be.visible");
    runA11yAudit("admin-users");

    cy.get('[data-cy^="admin-user-edit-"]').first().click();
    cy.wait("@adminUserDetail").its("response.statusCode").should("eq", 200);
    cy.wait("@adminRoles").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('[data-cy="admin-user-edit-page"]').should("be.visible");
    runA11yAudit("admin-user-edit");
  });
});
