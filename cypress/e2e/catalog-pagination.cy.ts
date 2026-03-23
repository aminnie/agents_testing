import { CatalogPage } from "../pages/CatalogPage";

describe("Feature: Catalog pagination", () => {
  const catalogPage = new CatalogPage();

  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog").as("catalog");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
  });

  it("should default to 10 items and support first/prev/next/last navigation", () => {
    let firstPageFirstItemText = "";
    cy.location("pathname").should("eq", "/store");
    cy.location("search").should("include", "page=1");
    cy.location("search").should("include", "pageSize=10");
    cy.get('[data-cy="catalog-list"] li').should("have.length", 10);
    cy.get('[data-cy="catalog-list"] li')
      .first()
      .invoke("text")
      .then((text) => {
        firstPageFirstItemText = text;
      });
    cy.get('[data-cy="catalog-page-first"]').should("be.disabled");
    cy.get('[data-cy="catalog-page-prev"]').should("be.disabled");

    catalogPage.pageIndicator().invoke("text").then((text) => {
      const match = text.match(/^Page (\d+) of (\d+)$/);
      expect(match, "page indicator format").to.not.equal(null);
      const totalPages = Number(match?.[2] || 1);

      if (totalPages === 1) {
        cy.get('[data-cy="catalog-page-next"]').should("be.disabled");
        cy.get('[data-cy="catalog-page-last"]').should("be.disabled");
        return;
      }

      cy.get('[data-cy="catalog-page-next"]').should("be.enabled");
      cy.get('[data-cy="catalog-page-last"]').should("be.enabled");

      catalogPage.goToNextPage();
      catalogPage.pageIndicator().should("have.text", `Page 2 of ${totalPages}`);
      cy.location("search").should("include", "page=2");
      cy.get('[data-cy="catalog-list"] li')
        .first()
        .invoke("text")
        .then((nextText) => {
          expect(nextText).not.to.eq(firstPageFirstItemText);
        });

      catalogPage.goToFirstPage();
      catalogPage.pageIndicator().should("have.text", `Page 1 of ${totalPages}`);
      cy.location("search").should("include", "page=1");

      catalogPage.goToLastPage();
      catalogPage.pageIndicator().should("have.text", `Page ${totalPages} of ${totalPages}`);
      cy.get('[data-cy="catalog-page-next"]').should("be.disabled");
      cy.get('[data-cy="catalog-page-last"]').should("be.disabled");

      if (totalPages > 1) {
        catalogPage.goToPreviousPage();
        catalogPage.pageIndicator().should("have.text", `Page ${totalPages - 1} of ${totalPages}`);
      }
    });
  });

  it("should support page size changes and disable controls when one page fits", () => {
    catalogPage.setPageSize(20);
    cy.location("search").should("include", "page=1");
    cy.location("search").should("include", "pageSize=20");
    cy.get('[data-cy="catalog-list"] li').should("have.length.at.most", 20);
    catalogPage.pageIndicator().invoke("text").then((text) => {
      const match = text.match(/^Page (\d+) of (\d+)$/);
      expect(match, "page indicator format").to.not.equal(null);
      const pageCount = Number(match?.[2] || 1);

      cy.get('[data-cy="catalog-page-first"]').should("be.disabled");
      cy.get('[data-cy="catalog-page-prev"]').should("be.disabled");
      if (pageCount === 1) {
        cy.get('[data-cy="catalog-page-next"]').should("be.disabled");
        cy.get('[data-cy="catalog-page-last"]').should("be.disabled");
      } else {
        cy.get('[data-cy="catalog-page-next"]').should("be.enabled");
        cy.get('[data-cy="catalog-page-last"]').should("be.enabled");
      }
    });

    catalogPage.setPageSize(50);
    cy.location("search").should("include", "page=1");
    cy.location("search").should("include", "pageSize=50");
    cy.get('[data-cy="catalog-list"] li').should("have.length.at.most", 50);
    catalogPage.pageIndicator().invoke("text").then((text) => {
      const match = text.match(/^Page (\d+) of (\d+)$/);
      expect(match, "page indicator format").to.not.equal(null);
      const pageCount = Number(match?.[2] || 1);

      cy.get('[data-cy="catalog-page-first"]').should("be.disabled");
      cy.get('[data-cy="catalog-page-prev"]').should("be.disabled");
      if (pageCount === 1) {
        cy.get('[data-cy="catalog-page-next"]').should("be.disabled");
        cy.get('[data-cy="catalog-page-last"]').should("be.disabled");
      } else {
        cy.get('[data-cy="catalog-page-next"]').should("be.enabled");
        cy.get('[data-cy="catalog-page-last"]').should("be.enabled");
      }
    });
  });

  it("should preserve page and page size when returning from item detail", () => {
    cy.visit("/store?page=2&pageSize=10");
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.location("search").should("include", "pageSize=10");

    let initialTotalPages = 1;
    catalogPage.pageIndicator().invoke("text").then((text) => {
      const match = text.match(/^Page (\d+) of (\d+)$/);
      expect(match, "page indicator format").to.not.equal(null);
      const currentPage = Number(match?.[1] || 1);
      const totalPages = Number(match?.[2] || 1);
      initialTotalPages = totalPages;

      cy.location("search").should("include", `page=${currentPage}`);

      catalogPage.viewFirstCatalogItem();
      cy.location("pathname").should("match", /^\/store\/item\/.+$/);
      cy.location("search").should("include", `page=${currentPage}`);
      cy.location("search").should("include", "pageSize=10");

      catalogPage.returnFromDetail();
      cy.location("pathname").should("eq", "/store");
      cy.location("search").should("include", `page=${currentPage}`);
      cy.location("search").should("include", "pageSize=10");
      catalogPage.pageIndicator().invoke("text").then((updatedText) => {
        const updatedMatch = updatedText.match(/^Page (\d+) of (\d+)$/);
        expect(updatedMatch, "updated page indicator format").to.not.equal(null);
        const updatedPage = Number(updatedMatch?.[1] || 1);
        const updatedTotalPages = Number(updatedMatch?.[2] || 1);

        // Preserve requested page when still valid; otherwise allow graceful fallback to page 1.
        if (initialTotalPages >= currentPage) {
          expect(updatedPage).to.eq(currentPage);
        } else {
          expect(updatedPage).to.eq(1);
        }
        expect(updatedTotalPages).to.be.greaterThan(0);
      });
    });
  });
});
