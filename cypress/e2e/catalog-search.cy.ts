import { CatalogPage } from "../pages/CatalogPage";

describe("Feature: Catalog search", () => {
  const catalogPage = new CatalogPage();

  function captureSearchTokenFromFirstItem() {
    return cy.get('[data-cy="catalog-list"] li').first().invoke("text").then((text) => {
      const [rawHeader] = String(text || "").split(" - ");
      const compact = rawHeader.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
      const token = compact.split(/\s+/).find((part) => part.length >= 4) || compact.slice(0, 6) || "item";
      return token.toLowerCase();
    });
  }

  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
  });

  it("filters catalog on explicit search submit and persists query in URL", () => {
    captureSearchTokenFromFirstItem().then((searchToken) => {
    cy.location("search").should("include", "page=1");
    cy.location("search").should("include", "pageSize=10");
    cy.location("search").should("not.include", "q=");

    catalogPage.typeSearchQuery(searchToken);
    cy.location("search").should("not.include", `q=${encodeURIComponent(searchToken)}`);

    catalogPage.submitSearch();
    cy.wait("@catalog").then((interception) => {
      expect(interception.request.url).to.include(`q=${encodeURIComponent(searchToken)}`);
      expect(interception.response?.statusCode).to.eq(200);
      const items = interception.response?.body?.items || [];
      expect(items.length, "filtered result set").to.be.greaterThan(0);
      items.forEach((item: { name?: string; header?: string; description?: string }) => {
        const candidate = `${item.name || ""} ${item.header || ""} ${item.description || ""}`.toLowerCase();
        expect(candidate).to.include(searchToken);
      });
    });

    cy.location("search").should("include", `q=${encodeURIComponent(searchToken)}`);
    cy.location("search").should("include", "page=1");
    });
  });

  it("resets to page 1 when search is submitted from another page", () => {
    captureSearchTokenFromFirstItem().then((searchToken) => {
    catalogPage.goToNextPage();
    cy.location("search").should("include", "page=2");

    catalogPage.typeSearchQuery(searchToken);
    catalogPage.submitSearch();
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    cy.location("search").should("include", `q=${encodeURIComponent(searchToken)}`);
    cy.location("search").should("include", "page=1");
    catalogPage.pageIndicator().should("contain.text", "Page 1 of");
    });
  });

  it("supports clear search and restores full-list URL state", () => {
    catalogPage.typeSearchQuery("zzzz-no-match-query");
    catalogPage.submitSearch();
    cy.wait("@catalog").its("response.statusCode").should("eq", 200);
    catalogPage.noResultsMessage().should("be.visible").and("have.text", "No results");
    cy.location("search").should("include", "q=zzzz-no-match-query");

    catalogPage.clearSearch();
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.location("search").should("not.include", "q=");
    cy.location("search").should("include", "page=1");
  });

  it("enforces a maximum search input length of 20 characters", () => {
    catalogPage.typeSearchQuery("abcdefghijklmnopqrstuvwxyz");
    cy.get('[data-cy="catalog-search-input"]').invoke("val").should("have.length", 20);
    catalogPage.submitSearch();
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.location("search").should("include", "q=abcdefghijklmnopqrst");
  });
});
