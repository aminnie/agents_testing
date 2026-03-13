import { CatalogPage } from "../pages/CatalogPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrdersPage } from "../pages/OrdersPage";

describe("Feature: Orders List", () => {
  const catalogPage = new CatalogPage();
  const checkoutPage = new CheckoutPage();
  const ordersPage = new OrdersPage();
  const createOrder = (orderId: string, status = "Ordered", totalCents = 1000) => ({
    orderId,
    createdAt: "2026-03-01T00:00:00.000Z",
    totalCents,
    status
  });

  beforeEach(() => {
    cy.intercept("POST", "/api/login").as("login");
    cy.intercept("GET", "/api/catalog*").as("catalog");
    cy.intercept("POST", "/api/checkout").as("checkout");
  });

  it("should list previous orders for the authenticated user with header-only fields", () => {
    cy.intercept("GET", "/api/orders*").as("orders");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.addFirstCatalogItem();
    cy.get('[data-cy="go-to-checkout"]').click();
    checkoutPage.fillAddress("500 Orders Lane", "Austin", "73301", "USA");
    checkoutPage.fillPayment("Anton Minnie", "4242424242424242");
    checkoutPage.submit();

    let createdOrderId = "";
    cy.wait("@checkout").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      createdOrderId = String(response?.body?.orderId || "");
      expect(createdOrderId).to.not.equal("");
    });

    cy.get('[data-cy="nav-store"]').click();
    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    ordersPage.title().should("be.visible");
    cy.wait("@orders").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const returnedOrders = response?.body?.orders || [];
      expect(returnedOrders.length).to.be.greaterThan(0);
      expect(returnedOrders[0].orderId).to.eq(createdOrderId);
      expect(returnedOrders[0]).to.have.keys(["orderId", "createdAt", "totalCents", "status"]);
    });

    cy.get('[data-cy^="orders-id-"]').first().should("contain", createdOrderId);
    ordersPage.firstOrderStatus().should("contain", "Status:");
    cy.get('[data-cy^="orders-item-"]').should("have.length.at.least", 1);
  });

  it("should allow cancellation only for eligible order statuses", () => {
    const cancellableOrderId = "01012024-00001";
    const lockedOrderId = "01012024-00002";

    cy.intercept("GET", "/api/orders*", {
      statusCode: 200,
      body: {
        orders: [
          {
            orderId: cancellableOrderId,
            createdAt: "2026-03-01T00:00:00.000Z",
            totalCents: 1000,
            status: "Ordered"
          },
          {
            orderId: lockedOrderId,
            createdAt: "2026-03-01T00:00:01.000Z",
            totalCents: 2000,
            status: "Shipped"
          }
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1
        },
        filters: {
          query: ""
        }
      }
    }).as("orders");
    cy.intercept("PATCH", `/api/orders/${cancellableOrderId}/status`, {
      statusCode: 200,
      body: {
        order: {
          orderId: cancellableOrderId,
          status: "Cancelled"
        }
      }
    }).as("cancelOrder");

    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@orders").its("response.statusCode").should("eq", 200);

    ordersPage.cancelButton(cancellableOrderId).should("be.visible").click();
    cy.wait("@cancelOrder").then(({ request, response }) => {
      expect(request.body).to.deep.equal({ status: "Cancelled" });
      expect(response?.statusCode).to.eq(200);
    });
    cy.get(`[data-cy="orders-status-${cancellableOrderId}"]`).should("contain", "Cancelled");
    ordersPage.cancelButton(cancellableOrderId).should("not.exist");
    ordersPage.cancelButton(lockedOrderId).should("not.exist");
  });

  it("should show an empty-state message when no previous orders exist", () => {
    cy.intercept("GET", "/api/orders*", {
      statusCode: 200,
      body: {
        orders: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 1
        },
        filters: {
          query: ""
        }
      }
    }).as("orders");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@orders").its("response.statusCode").should("eq", 200);
    ordersPage.emptyState().should("contain", "No previous orders");
  });

  it("should show a deterministic error message when orders request fails", () => {
    cy.intercept("GET", "/api/orders*", {
      statusCode: 500,
      body: { message: "Could not load orders" }
    }).as("orders");
    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@orders").its("response.statusCode").should("eq", 500);
    ordersPage.errorMessage().should("contain", "Could not load orders");
  });

  it("should search orders by order number and show no-results message for unmatched query", () => {
    const firstOrder = createOrder("01012024-00001", "Ordered", 1000);
    const secondOrder = createOrder("01012024-00002", "Processing", 2000);

    cy.intercept("GET", "/api/orders*", (req) => {
      const query = String(req.query.q || "");
      if (query === "01012024-00002") {
        req.alias = "ordersSearchById";
        req.reply({
          statusCode: 200,
          body: {
            orders: [secondOrder],
            pagination: {
              page: 1,
              pageSize: 10,
              totalItems: 1,
              totalPages: 1
            },
            filters: {
              query
            }
          }
        });
        return;
      }

      if (query === "NO_MATCH_QUERY") {
        req.alias = "ordersSearchNoMatch";
        req.reply({
          statusCode: 200,
          body: {
            orders: [],
            pagination: {
              page: 1,
              pageSize: 10,
              totalItems: 0,
              totalPages: 1
            },
            filters: {
              query
            }
          }
        });
        return;
      }

      req.alias = "ordersDefault";
      req.reply({
        statusCode: 200,
        body: {
          orders: [firstOrder, secondOrder],
          pagination: {
            page: 1,
            pageSize: 10,
            totalItems: 2,
            totalPages: 1
          },
          filters: {
            query: ""
          }
        }
      });
    }).as("orders");

    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@ordersDefault").its("response.statusCode").should("eq", 200);

    ordersPage.searchInput().type("01012024-00002");
    ordersPage.searchSubmit().click();
    cy.wait("@ordersSearchById").its("response.statusCode").should("eq", 200);
    cy.location("search").should("include", "q=01012024-00002");
    cy.get('[data-cy="orders-id-01012024-00002"]').should("be.visible");
    cy.get('[data-cy="orders-id-01012024-00001"]').should("not.exist");

    ordersPage.searchInput().clear().type("NO_MATCH_QUERY");
    ordersPage.searchSubmit().click();
    cy.wait("@ordersSearchNoMatch").its("response.statusCode").should("eq", 200);
    cy.location("search").should("include", "q=NO_MATCH_QUERY");
    ordersPage.noResults().should("contain", "No matching orders");
  });

  it("should paginate orders and reset to page one on page-size change", () => {
    const pageOneOrder = createOrder("01012024-00001", "Ordered", 1000);
    const pageTwoOrder = createOrder("01012024-00011", "Ordered", 1100);
    const pageTwentyOrder = createOrder("01012024-00020", "Processing", 2000);

    cy.intercept("GET", "/api/orders*", (req) => {
      const page = String(req.query.page || "1");
      const pageSize = String(req.query.pageSize || "10");
      if (pageSize === "20") {
        req.alias = "ordersPageSizeTwenty";
        req.reply({
          statusCode: 200,
          body: {
            orders: [pageOneOrder, pageTwentyOrder],
            pagination: {
              page: 1,
              pageSize: 20,
              totalItems: 25,
              totalPages: 2
            },
            filters: {
              query: ""
            }
          }
        });
        return;
      }

      if (page === "2") {
        req.alias = "ordersPageTwo";
        req.reply({
          statusCode: 200,
          body: {
            orders: [pageTwoOrder],
            pagination: {
              page: 2,
              pageSize: 10,
              totalItems: 25,
              totalPages: 3
            },
            filters: {
              query: ""
            }
          }
        });
        return;
      }

      req.alias = "ordersPageOne";
      req.reply({
        statusCode: 200,
        body: {
          orders: [pageOneOrder],
          pagination: {
            page: 1,
            pageSize: 10,
            totalItems: 25,
            totalPages: 3
          },
          filters: {
            query: ""
          }
        }
      });
    }).as("orders");

    cy.loginUi();
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.wait("@catalog").its("response.statusCode").should("be.oneOf", [200, 304]);

    catalogPage.goToOrders();
    cy.location("pathname").should("eq", "/orders");
    cy.wait("@ordersPageOne").its("response.statusCode").should("eq", 200);
    ordersPage.pageIndicator().should("contain", "Page 1 of 3");

    ordersPage.nextPage().click();
    cy.wait("@ordersPageTwo").its("response.statusCode").should("eq", 200);
    cy.location("search").should("include", "page=2");
    ordersPage.pageIndicator().should("contain", "Page 2 of 3");
    cy.get('[data-cy="orders-id-01012024-00011"]').should("be.visible");

    ordersPage.pageSize().select("20");
    cy.wait("@ordersPageSizeTwenty").its("response.statusCode").should("eq", 200);
    cy.location("search").should("include", "page=1");
    cy.location("search").should("include", "pageSize=20");
    ordersPage.pageIndicator().should("contain", "Page 1 of 2");
    cy.get('[data-cy="orders-id-01012024-00020"]').should("be.visible");
  });
});
