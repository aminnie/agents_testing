import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import AppHeader from "./components/AppHeader.jsx";
import CheckoutPage from "./components/CheckoutPage.jsx";
import HelpPage from "./components/HelpPage.jsx";
import ItemDetailPage from "./components/ItemDetailPage.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import OrderDetailsPage from "./components/OrderDetailsPage.jsx";
import OrdersPage from "./components/OrdersPage.jsx";
import ProductFormPage from "./components/ProductFormPage.jsx";
import RegisterScreen from "./components/RegisterScreen.jsx";
import StorePage from "./components/StorePage.jsx";
import UserAdminPage from "./components/UserAdminPage.jsx";
import UserEditPage from "./components/UserEditPage.jsx";
import theme from "./theme.js";

const STORAGE_KEYS = Object.freeze({
  auth: ["store", "auth", "state"].join("-"),
  user: ["store", "user", "state"].join("-")
});
const STORE_PAGE_SIZE_OPTIONS = Object.freeze([10, 20, 50]);
const DEFAULT_STORE_PAGE_SIZE = 10;
const ORDER_PAGE_SIZE_OPTIONS = Object.freeze([10, 20, 30, 40, 50]);
const DEFAULT_ORDER_PAGE_SIZE = 10;
const MAX_ORDER_SEARCH_QUERY_LENGTH = 60;
const MAX_CANCELLATION_REASON_LENGTH = 300;
const POSTAL_CODE_PATTERN = /^[0-9-]{1,15}$/;

function createEmptyAddress() {
  return {
    street: "",
    city: "",
    postalCode: "",
    country: ""
  };
}

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function buildStoreSearch(currentSearch, page, pageSize, query = "") {
  const params = new URLSearchParams(currentSearch);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const normalizedQuery = String(query || "").trim();
  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  } else {
    params.delete("q");
  }
  return `?${params.toString()}`;
}

function buildOrdersSearch(currentSearch, page, pageSize, query = "") {
  const params = new URLSearchParams(currentSearch);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const normalizedQuery = String(query || "").trim();
  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  } else {
    params.delete("q");
  }
  return `?${params.toString()}`;
}

function isPrintableSearchText(value) {
  return /^[\x20-\x7E]*$/.test(String(value || ""));
}

function hasSupportedCancellationReasonCharacters(value) {
  return /^[\x09\x0A\x0D\x20-\x7E]*$/.test(String(value || ""));
}

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function readStoredUser() {
  const rawValue = localStorage.getItem(STORAGE_KEYS.user);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    localStorage.removeItem(STORAGE_KEYS.user);
    return null;
  }
}

function normalizeAddress(rawAddress) {
  return {
    street: String(rawAddress?.street || "").trim().replace(/\s+/g, " "),
    city: String(rawAddress?.city || "").trim().replace(/\s+/g, " "),
    postalCode: String(rawAddress?.postalCode || "").trim(),
    country: String(rawAddress?.country || "").trim().replace(/\s+/g, " ")
  };
}

function validateAddress(address) {
  const errors = {};
  if (!address.street) {
    errors.street = "Street is required";
  } else if (address.street.length > 50) {
    errors.street = "Street must be 50 characters or fewer";
  }
  if (!address.city) {
    errors.city = "City is required";
  } else if (address.city.length > 30) {
    errors.city = "City must be 30 characters or fewer";
  }
  if (!address.postalCode) {
    errors.postalCode = "Postal code is required";
  } else if (!POSTAL_CODE_PATTERN.test(address.postalCode)) {
    errors.postalCode = "Postal code must contain only digits and '-' and be 15 characters or fewer";
  }
  if (!address.country) {
    errors.country = "Country is required";
  } else if (address.country.length > 30) {
    errors.country = "Country must be 30 characters or fewer";
  }
  return errors;
}

function ItemDetailRoute({
  catalog,
  loadingCatalog,
  totalLabel,
  onAddToCartAndReturn,
  onReturnToStore,
  onGoNewProduct,
  onEditItem,
  isProductManagementEnabled
}) {
  const { itemId = "" } = useParams();
  const item = catalog.find((entry) => entry.id === itemId);

  return (
    <ItemDetailPage
      item={item}
      itemId={itemId}
      loadingCatalog={loadingCatalog}
      onAddToCartAndReturn={onAddToCartAndReturn}
      onReturnToStore={onReturnToStore}
      onGoNewProduct={onGoNewProduct}
      onEditItem={onEditItem}
      isProductManagementEnabled={isProductManagementEnabled}
      totalLabel={totalLabel}
    />
  );
}

function ProductFormRoute({
  mode,
  catalog,
  loadingCatalog,
  isProductManagementEnabled,
  onCreateProduct,
  onUpdateProduct,
  onCancel,
  errorMessage,
  isSubmitting
}) {
  const { itemId = "" } = useParams();
  const item = mode === "edit" ? catalog.find((entry) => entry.id === itemId) : null;

  return (
    <ProductFormPage
      mode={mode}
      item={item}
      itemId={itemId}
      loadingCatalog={loadingCatalog}
      canManageProducts={isProductManagementEnabled}
      onSubmit={(values) => (mode === "edit" ? onUpdateProduct(itemId, values) : onCreateProduct(values))}
      onCancel={onCancel}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
    />
  );
}

function OrderDetailsRoute({
  token,
  formatPrice,
  onSessionInvalid,
  onGoOrders
}) {
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || !orderId) {
      setOrder(null);
      setItems([]);
      setErrorMessage("Order not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (response) => {
        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("SESSION_INVALID");
          }
          if (response.status === 404) {
            throw new Error("ORDER_NOT_FOUND");
          }
          throw new Error(payload.message || "Could not load order details");
        }
        return payload;
      })
      .then((data) => {
        setOrder(data.order || null);
        setItems(Array.isArray(data.items) ? data.items : []);
        setErrorMessage("");
      })
      .catch((error) => {
        const message = String(error?.message || "");
        if (message === "SESSION_INVALID") {
          onSessionInvalid();
          return;
        }
        setOrder(null);
        setItems([]);
        setErrorMessage(message === "ORDER_NOT_FOUND" ? "Order not found" : message || "Could not load order details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, orderId, onSessionInvalid]);

  return (
    <OrderDetailsPage
      errorMessage={errorMessage}
      formatPrice={formatPrice}
      items={items}
      loading={loading}
      order={order}
      onGoOrders={onGoOrders}
    />
  );
}

function StoreApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerAddress, setRegisterAddress] = useState(createEmptyAddress);
  const [registerError, setRegisterError] = useState("");
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.auth) || "");
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [cart, setCart] = useState([]);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState(() => normalizeAddress(currentUser));
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState("");
  const [cancelModalOrderId, setCancelModalOrderId] = useState("");
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const currentSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isStorePath = location.pathname.startsWith("/store");
  const isOrdersPath = location.pathname === "/orders";
  const [searchInput, setSearchInput] = useState(() => (isStorePath ? currentSearchParams.get("q") || "" : ""));
  const [searchError, setSearchError] = useState("");
  const [ordersSearchInput, setOrdersSearchInput] = useState(() => (isOrdersPath ? currentSearchParams.get("q") || "" : ""));
  const [ordersSearchError, setOrdersSearchError] = useState("");
  const [ordersPagination, setOrdersPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: DEFAULT_ORDER_PAGE_SIZE,
    totalItems: 0
  });
  const [productFormError, setProductFormError] = useState("");
  const [productFormSubmitting, setProductFormSubmitting] = useState(false);
  const isProductManager = ["editor", "manager"].includes(currentUser?.role || "");
  const isAdmin = (currentUser?.role || "") === "admin";
  const activeCatalogSearchQuery = isStorePath ? String(currentSearchParams.get("q") || "").trim() : "";
  const requestedPageSize = parsePositiveInteger(
    isStorePath ? currentSearchParams.get("pageSize") : DEFAULT_STORE_PAGE_SIZE,
    DEFAULT_STORE_PAGE_SIZE
  );
  const pageSize = STORE_PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : DEFAULT_STORE_PAGE_SIZE;
  const requestedPage = parsePositiveInteger(isStorePath ? currentSearchParams.get("page") : 1, 1);
  const totalItems = catalog.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const activeOrdersSearchQuery = isOrdersPath ? String(currentSearchParams.get("q") || "").trim() : "";
  const requestedOrdersPageSize = parsePositiveInteger(
    isOrdersPath ? currentSearchParams.get("pageSize") : DEFAULT_ORDER_PAGE_SIZE,
    DEFAULT_ORDER_PAGE_SIZE
  );
  const ordersPageSize = ORDER_PAGE_SIZE_OPTIONS.includes(requestedOrdersPageSize)
    ? requestedOrdersPageSize
    : DEFAULT_ORDER_PAGE_SIZE;
  const requestedOrdersPage = parsePositiveInteger(isOrdersPath ? currentSearchParams.get("page") : 1, 1);
  const pagedCatalog = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return catalog.slice(startIndex, startIndex + pageSize);
  }, [catalog, currentPage, pageSize]);

  const totalCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [cart]
  );
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart]
  );

  function resetRegisterFormState() {
    setRegisterDisplayName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterAddress(createEmptyAddress());
    setRegisterError("");
    setRegisterSubmitting(false);
  }

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.user);
    setToken("");
    setCurrentUser(null);
    setCatalog([]);
    setCatalogError("");
    setSearchInput("");
    setSearchError("");
    setOrdersSearchInput("");
    setOrdersSearchError("");
    setCart([]);
    setOrderMessage("");
    setOrderId("");
    setCheckoutError("");
    setNameOnCard("");
    setCardNumber("");
    setCheckoutAddress(createEmptyAddress());
    setOrders([]);
    setOrdersError("");
    setOrdersPagination({
      currentPage: 1,
      totalPages: 1,
      pageSize: DEFAULT_ORDER_PAGE_SIZE,
      totalItems: 0
    });
    setLoadingOrders(false);
    setCancellingOrderId("");
    setCancelModalOrderId("");
    setCancelReasonInput("");
    setCancelReasonError("");
  }, []);

  const handleSessionInvalid = useCallback(() => {
    clearSession();
    setAuthError("Session expired. Please sign in again.");
  }, [clearSession]);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    if (location.pathname === "/register" && previousPathname !== "/register") {
      resetRegisterFormState();
    }
    previousPathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!token && !["/", "/help", "/register"].includes(location.pathname)) {
      navigate("/", { replace: true });
      return;
    }

    if (token && location.pathname === "/") {
      navigate("/store", { replace: true });
    }
  }, [token, location.pathname, navigate]);

  useEffect(() => {
    if (!isStorePath) {
      return;
    }
    setSearchInput(activeCatalogSearchQuery);
  }, [isStorePath, activeCatalogSearchQuery]);

  useEffect(() => {
    if (!isOrdersPath) {
      return;
    }
    setOrdersSearchInput(activeOrdersSearchQuery);
  }, [isOrdersPath, activeOrdersSearchQuery]);

  useEffect(() => {
    if (!token || location.pathname !== "/store") {
      return;
    }
    const normalizedSearch = buildStoreSearch("", currentPage, pageSize, activeCatalogSearchQuery);
    if (location.search !== normalizedSearch) {
      navigate({ pathname: "/store", search: normalizedSearch }, { replace: true });
    }
  }, [token, location.pathname, location.search, currentPage, pageSize, activeCatalogSearchQuery, navigate]);

  useEffect(() => {
    if (!token || location.pathname !== "/orders") {
      return;
    }
    const normalizedSearch = buildOrdersSearch("", requestedOrdersPage, ordersPageSize, activeOrdersSearchQuery);
    if (location.search !== normalizedSearch) {
      navigate({ pathname: "/orders", search: normalizedSearch }, { replace: true });
    }
  }, [token, location.pathname, location.search, requestedOrdersPage, ordersPageSize, activeOrdersSearchQuery, navigate]);

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoadingCatalog(true);
    const catalogUrl = activeCatalogSearchQuery
      ? `/api/catalog?q=${encodeURIComponent(activeCatalogSearchQuery)}`
      : "/api/catalog";

    fetch(catalogUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (response) => {
        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("SESSION_INVALID");
          }
          throw new Error(payload.message || "Could not load catalog");
        }
        return payload;
      })
      .then((data) => {
        setCatalogError("");
        setCatalog(data.items || []);
      })
      .catch((error) => {
        if (String(error?.message || "") === "SESSION_INVALID") {
          handleSessionInvalid();
          return;
        }
        setCatalog([]);
        setCatalogError(String(error?.message || "Could not load catalog"));
      })
      .finally(() => setLoadingCatalog(false));
  }, [token, activeCatalogSearchQuery, handleSessionInvalid]);

  const loadOrders = useCallback(() => {
    if (!token) {
      return Promise.resolve();
    }
    setLoadingOrders(true);
    const params = new URLSearchParams();
    params.set("page", String(requestedOrdersPage));
    params.set("pageSize", String(ordersPageSize));
    if (activeOrdersSearchQuery) {
      params.set("q", activeOrdersSearchQuery);
    }
    return fetch(`/api/orders?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (response) => {
        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("SESSION_INVALID");
          }
          throw new Error(payload.message || "Could not load orders");
        }
        return payload;
      })
      .then((data) => {
        setOrdersError("");
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        const responsePagination = data.pagination || {};
        const nextPageSize = ORDER_PAGE_SIZE_OPTIONS.includes(Number(responsePagination.pageSize))
          ? Number(responsePagination.pageSize)
          : ordersPageSize;
        const nextTotalItems = Number(responsePagination.totalItems || 0);
        const nextTotalPages = Math.max(1, Number(responsePagination.totalPages || 1));
        const nextCurrentPage = Math.min(
          Math.max(1, Number(responsePagination.page || requestedOrdersPage)),
          nextTotalPages
        );
        setOrdersPagination({
          currentPage: nextCurrentPage,
          totalPages: nextTotalPages,
          pageSize: nextPageSize,
          totalItems: nextTotalItems
        });
        if (location.pathname === "/orders") {
          const normalizedSearch = buildOrdersSearch("", nextCurrentPage, nextPageSize, activeOrdersSearchQuery);
          if (location.search !== normalizedSearch) {
            navigate({ pathname: "/orders", search: normalizedSearch }, { replace: true });
          }
        }
      })
      .catch((error) => {
        if (String(error?.message || "") === "SESSION_INVALID") {
          handleSessionInvalid();
          return;
        }
        setOrders([]);
        setOrdersError(String(error?.message || "Could not load orders"));
        setOrdersPagination((current) => ({
          ...current,
          currentPage: 1,
          totalPages: 1,
          totalItems: 0
        }));
      })
      .finally(() => setLoadingOrders(false));
  }, [
    token,
    requestedOrdersPage,
    ordersPageSize,
    activeOrdersSearchQuery,
    location.pathname,
    location.search,
    navigate,
    handleSessionInvalid
  ]);

  useEffect(() => {
    if (location.pathname !== "/orders") {
      return;
    }
    void loadOrders();
  }, [location.pathname, loadOrders]);

  useEffect(() => {
    if (location.pathname === "/orders") {
      return;
    }
    setCancelModalOrderId("");
    setCancelReasonInput("");
    setCancelReasonError("");
  }, [location.pathname]);

  function openCancelOrderModal(orderId) {
    if (!orderId || cancellingOrderId) {
      return;
    }
    setOrdersError("");
    setCancelReasonError("");
    setCancelReasonInput("");
    setCancelModalOrderId(orderId);
  }

  function closeCancelOrderModal() {
    if (cancellingOrderId) {
      return;
    }
    setCancelModalOrderId("");
    setCancelReasonInput("");
    setCancelReasonError("");
  }

  async function confirmCancelOrder() {
    if (!token || !cancelModalOrderId) {
      return;
    }
    const normalizedReason = String(cancelReasonInput || "").trim();
    if (!normalizedReason) {
      setCancelReasonError("Cancellation reason is required");
      return;
    }
    if (normalizedReason.length > MAX_CANCELLATION_REASON_LENGTH) {
      setCancelReasonError(`Cancellation reason must be ${MAX_CANCELLATION_REASON_LENGTH} characters or fewer`);
      return;
    }
    if (!hasSupportedCancellationReasonCharacters(normalizedReason)) {
      setCancelReasonError("Cancellation reason contains unsupported characters");
      return;
    }

    const orderId = cancelModalOrderId;
    setOrdersError("");
    setCancelReasonError("");
    setCancellingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "Cancelled",
          reason: normalizedReason
        })
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionInvalid();
          return;
        }
        const message = payload.message || "Could not cancel order";
        setOrdersError(message);
        setCancelReasonError(message);
        return;
      }

      const nextStatus = String(payload?.order?.status || "Cancelled");
      setOrders((current) =>
        current.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                status: nextStatus
              }
            : order
        )
      );
      setCancelModalOrderId("");
      setCancelReasonInput("");
      setCancelReasonError("");
    } catch {
      const message = "Could not cancel order";
      setOrdersError(message);
      setCancelReasonError(message);
    } finally {
      setCancellingOrderId("");
    }
  }

  function persistAuth(nextToken, user) {
    localStorage.setItem(STORAGE_KEYS.auth, nextToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    setToken(nextToken);
    setCurrentUser(user);
    setCheckoutAddress(normalizeAddress(user));
  }

  async function onLoginSubmit(event) {
    event.preventDefault();
    setAuthError("");

    if (!email || !password) {
      setAuthError("Email and password are required");
      return;
    }

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json();
    if (!response.ok) {
      setAuthError(payload.message || "Login failed");
      return;
    }

    persistAuth(payload.token, payload.user);
    navigate("/store", { replace: true });
  }

  async function onRegisterSubmit(event) {
    event.preventDefault();
    setRegisterError("");

    const normalizedDisplayName = registerDisplayName.trim().replace(/\s+/g, " ");
    const normalizedEmail = registerEmail.trim().toLowerCase();
    const normalizedPassword = registerPassword.trim();
    const normalizedAddress = normalizeAddress(registerAddress);
    const addressErrors = validateAddress(normalizedAddress);

    if (!normalizedDisplayName || !normalizedEmail || !normalizedPassword || Object.keys(addressErrors).length > 0) {
      const firstAddressError = Object.values(addressErrors)[0];
      setRegisterError(firstAddressError || "Display name, email, password, and address are required");
      return;
    }

    if (normalizedPassword.length < 8) {
      setRegisterError("Password must be at least 8 characters");
      return;
    }

    setRegisterSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: normalizedDisplayName,
          email: normalizedEmail,
          password: normalizedPassword,
          ...normalizedAddress
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setRegisterError(payload.message || "Registration failed");
        return;
      }
      persistAuth(payload.token, payload.user);
      setEmail(normalizedEmail);
      setPassword("");
      setRegisterPassword("");
      navigate("/store", { replace: true });
    } catch {
      setRegisterError("Registration failed");
    } finally {
      setRegisterSubmitting(false);
    }
  }

  async function logout() {
    try {
      if (token) {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch {
      // Ignore logout transport errors; local session must still be cleared.
    }
    clearSession();
    setPassword("");
    setAuthError("");
    navigate("/", { replace: true });
  }

  function addToCart(item) {
    setOrderMessage("");
    setOrderId("");
    setCheckoutError("");
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (!existing) {
        return [...current, { ...item, quantity: 1 }];
      }
      return current.map((entry) =>
        entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
      );
    });
  }

  function incrementCartItem(itemId) {
    setCart((current) =>
      current.map((entry) =>
        entry.id === itemId ? { ...entry, quantity: entry.quantity + 1 } : entry
      )
    );
  }

  function decrementCartItem(itemId) {
    setCart((current) =>
      current.flatMap((entry) => {
        if (entry.id !== itemId) {
          return [entry];
        }
        if (entry.quantity <= 1) {
          return [];
        }
        return [{ ...entry, quantity: entry.quantity - 1 }];
      })
    );
  }

  function removeCartItem(itemId) {
    setCart((current) => current.filter((entry) => entry.id !== itemId));
  }

  function viewItem(itemId) {
    navigate({
      pathname: `/store/item/${encodeURIComponent(itemId)}`,
      search: buildStoreSearch("", currentPage, pageSize, activeCatalogSearchQuery)
    });
  }

  function addToCartAndReturn(item) {
    addToCart(item);
    navigate({
      pathname: "/store",
      search: buildStoreSearch("", currentPage, pageSize, activeCatalogSearchQuery)
    });
  }

  function goToStore() {
    navigate({
      pathname: "/store",
      search: buildStoreSearch("", currentPage, pageSize, activeCatalogSearchQuery)
    });
  }

  function goToPage(nextPage, nextPageSize = pageSize, replace = false, nextSearchQuery = activeCatalogSearchQuery) {
    const boundedPageSize = STORE_PAGE_SIZE_OPTIONS.includes(nextPageSize) ? nextPageSize : DEFAULT_STORE_PAGE_SIZE;
    const boundedTotalPages = Math.max(1, Math.ceil(totalItems / boundedPageSize));
    const boundedPage = Math.min(Math.max(1, nextPage), boundedTotalPages);
    navigate(
      {
        pathname: "/store",
        search: buildStoreSearch("", boundedPage, boundedPageSize, nextSearchQuery)
      },
      { replace }
    );
  }

  function goToOrdersPage(
    nextPage,
    nextPageSize = ordersPageSize,
    replace = false,
    nextSearchQuery = activeOrdersSearchQuery
  ) {
    const boundedPageSize = ORDER_PAGE_SIZE_OPTIONS.includes(nextPageSize) ? nextPageSize : DEFAULT_ORDER_PAGE_SIZE;
    const boundedPage = Math.max(1, nextPage);
    navigate(
      {
        pathname: "/orders",
        search: buildOrdersSearch("", boundedPage, boundedPageSize, nextSearchQuery)
      },
      { replace }
    );
  }

  function submitCatalogSearch(event) {
    event.preventDefault();
    const normalizedQuery = String(searchInput || "").trim();
    if (!normalizedQuery) {
      setSearchError("");
      setCatalogError("");
      goToPage(1, pageSize, false, "");
      return;
    }
    if (normalizedQuery.length > 20) {
      setSearchError("Search query must be 20 characters or fewer");
      return;
    }
    if (!isPrintableSearchText(normalizedQuery)) {
      setSearchError("Search query contains unsupported characters");
      return;
    }
    setSearchError("");
    setCatalogError("");
    goToPage(1, pageSize, false, normalizedQuery);
  }

  function clearCatalogSearch() {
    setSearchInput("");
    setSearchError("");
    setCatalogError("");
    goToPage(1, pageSize, false, "");
  }

  function submitOrdersSearch(event) {
    event.preventDefault();
    const normalizedQuery = String(ordersSearchInput || "").trim();
    if (!normalizedQuery) {
      setOrdersSearchError("");
      setOrdersError("");
      goToOrdersPage(1, ordersPageSize, false, "");
      return;
    }
    if (normalizedQuery.length > MAX_ORDER_SEARCH_QUERY_LENGTH) {
      setOrdersSearchError(`Search query must be ${MAX_ORDER_SEARCH_QUERY_LENGTH} characters or fewer`);
      return;
    }
    if (!isPrintableSearchText(normalizedQuery)) {
      setOrdersSearchError("Search query contains unsupported characters");
      return;
    }
    setOrdersSearchError("");
    setOrdersError("");
    goToOrdersPage(1, ordersPageSize, false, normalizedQuery);
  }

  function clearOrdersSearch() {
    setOrdersSearchInput("");
    setOrdersSearchError("");
    setOrdersError("");
    goToOrdersPage(1, ordersPageSize, false, "");
  }

  function openNewProductForm() {
    setProductFormError("");
    navigate("/store/product/new");
  }

  function viewProductEditor(itemId) {
    setProductFormError("");
    navigate(`/store/product/${encodeURIComponent(itemId)}/edit`);
  }

  function addOrReplaceCatalogItem(nextItem) {
    setCatalog((current) => {
      const existingIndex = current.findIndex((entry) => entry.id === nextItem.id);
      if (existingIndex === -1) {
        return [nextItem, ...current];
      }
      return current.map((entry) => (entry.id === nextItem.id ? { ...entry, ...nextItem } : entry));
    });
  }

  async function createProduct(values) {
    setProductFormError("");
    setProductFormSubmitting(true);
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      const payload = await response.json();
      if (!response.ok) {
        setProductFormError(payload.message || "Could not create product");
        return;
      }
      addOrReplaceCatalogItem(payload.item);
      navigate("/store", { replace: true });
    } catch {
      setProductFormError("Could not create product");
    } finally {
      setProductFormSubmitting(false);
    }
  }

  async function updateProduct(itemId, values) {
    setProductFormError("");
    setProductFormSubmitting(true);
    try {
      const response = await fetch(`/api/catalog/${encodeURIComponent(itemId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      const payload = await response.json();
      if (!response.ok) {
        setProductFormError(payload.message || "Could not update product");
        return;
      }
      addOrReplaceCatalogItem(payload.item);
      navigate("/store", { replace: true });
    } catch {
      setProductFormError("Could not update product");
    } finally {
      setProductFormSubmitting(false);
    }
  }

  async function submitCheckout(event) {
    event.preventDefault();
    setCheckoutError("");
    setOrderMessage("");
    setOrderId("");

    const formData = new FormData(event.currentTarget);
    const submittedName = String(formData.get("nameOnCard") || "")
      .trim();
    const submittedCard = String(formData.get("cardNumber") || "")
      .replace(/\D/g, "");
    const normalizedAddress = normalizeAddress({
      street: formData.get("street"),
      city: formData.get("city"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country")
    });
    const addressErrors = validateAddress(normalizedAddress);

    // Keep state synchronized with the submitted values (including autofill/manual browser fills).
    setNameOnCard(submittedName);
    setCardNumber(submittedCard);
    setCheckoutAddress(normalizedAddress);

    if (cart.length === 0) {
      setCheckoutError("Cart cannot be empty");
      return;
    }

    if (!submittedName || submittedCard.length <= 4) {
      setCheckoutError("Payment details are required");
      return;
    }
    if (Object.keys(addressErrors).length > 0) {
      setCheckoutError(String(Object.values(addressErrors)[0]));
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
        payment: {
          nameOnCard: submittedName,
          cardNumber: submittedCard
        },
        address: normalizedAddress
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setCheckoutError(payload.message || "Checkout failed");
      return;
    }

    setOrderMessage(`Order confirmed (#${payload.orderId})`);
    setOrderId(String(payload.orderId || ""));
    if (payload.user) {
      const nextUser = {
        ...(currentUser || {}),
        ...payload.user
      };
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
      setCurrentUser(nextUser);
      setCheckoutAddress(normalizeAddress(nextUser));
    }
    setCart([]);
    setNameOnCard("");
    setCardNumber("");
  }

  if (!token) {
    return (
      <main className="container">
        <Routes>
          <Route path="/help" element={<HelpPage onBack={() => navigate("/")} showSimpleHeader />} />
          <Route
            path="/register"
            element={
              <RegisterScreen
                displayName={registerDisplayName}
                email={registerEmail}
                password={registerPassword}
                street={registerAddress.street}
                city={registerAddress.city}
                postalCode={registerAddress.postalCode}
                country={registerAddress.country}
                registerError={registerError}
                isSubmitting={registerSubmitting}
                onDisplayNameChange={(event) => setRegisterDisplayName(event.target.value)}
                onEmailChange={(event) => setRegisterEmail(event.target.value)}
                onPasswordChange={(event) => setRegisterPassword(event.target.value)}
                onStreetChange={(event) => setRegisterAddress((current) => ({ ...current, street: event.target.value }))}
                onCityChange={(event) => setRegisterAddress((current) => ({ ...current, city: event.target.value }))}
                onPostalCodeChange={(event) => setRegisterAddress((current) => ({ ...current, postalCode: event.target.value }))}
                onCountryChange={(event) => setRegisterAddress((current) => ({ ...current, country: event.target.value }))}
                onSubmit={onRegisterSubmit}
                onBackToLogin={() => navigate("/", { replace: true })}
              />
            }
          />
          <Route
            path="*"
            element={
              <LoginScreen
                authError={authError}
                email={email}
                onGoHelp={() => navigate("/help")}
                onGoRegister={() => navigate("/register")}
                onEmailChange={(event) => setEmail(event.target.value)}
                onPasswordChange={(event) => setPassword(event.target.value)}
                onSubmit={onLoginSubmit}
                password={password}
              />
            }
          />
        </Routes>
      </main>
    );
  }

  return (
    <main className="container">
      <AppHeader
        cartItemCount={cartItemCount}
        isAdmin={isAdmin}
        onGoCheckout={() => navigate("/checkout")}
        onGoHelp={() => navigate("/help")}
        onGoNewProduct={openNewProductForm}
        onGoStore={goToStore}
        onGoUserAdmin={() => navigate("/admin/users")}
        onLogout={logout}
        isProductManagementEnabled={isProductManager}
        userEmail={currentUser?.email}
      />

      <Routes>
        <Route
          path="/store"
          element={
            <StorePage
              cart={cart}
              catalog={pagedCatalog}
              catalogError={catalogError}
              loadingCatalog={loadingCatalog}
              searchInput={searchInput}
              searchError={searchError}
              isSearchActive={Boolean(activeCatalogSearchQuery)}
              onAddToCart={addToCart}
              onSearchInputChange={(event) => {
                setSearchInput(event.target.value);
                if (searchError) {
                  setSearchError("");
                }
              }}
              onSearchSubmit={submitCatalogSearch}
              onClearSearch={clearCatalogSearch}
              onEditItem={viewProductEditor}
              onViewItem={viewItem}
              onGoCheckout={() => navigate("/checkout")}
              onGoOrders={() => navigate("/orders")}
              pagination={{
                currentPage,
                totalPages,
                pageSize,
                totalItems
              }}
              onFirstPage={() => goToPage(1)}
              onPrevPage={() => goToPage(currentPage - 1)}
              onNextPage={() => goToPage(currentPage + 1)}
              onLastPage={() => goToPage(totalPages)}
              onPageSizeChange={(nextPageSize) => goToPage(1, nextPageSize)}
              isProductManagementEnabled={isProductManager}
              totalLabel={formatPrice}
            />
          }
        />
        <Route
          path="/orders"
          element={
            <OrdersPage
              errorMessage={ordersError}
              formatPrice={formatPrice}
              loading={loadingOrders}
              orders={orders}
              onCancelOrder={openCancelOrderModal}
              cancellingOrderId={cancellingOrderId}
              searchInput={ordersSearchInput}
              searchError={ordersSearchError}
              isSearchActive={Boolean(activeOrdersSearchQuery)}
              onSearchInputChange={(event) => {
                setOrdersSearchInput(event.target.value);
                if (ordersSearchError) {
                  setOrdersSearchError("");
                }
              }}
              onSearchSubmit={submitOrdersSearch}
              onClearSearch={clearOrdersSearch}
              pagination={ordersPagination}
              onFirstPage={() => goToOrdersPage(1)}
              onPrevPage={() => goToOrdersPage(ordersPagination.currentPage - 1)}
              onNextPage={() => goToOrdersPage(ordersPagination.currentPage + 1)}
              onLastPage={() => goToOrdersPage(ordersPagination.totalPages)}
              onPageSizeChange={(nextPageSize) => goToOrdersPage(1, nextPageSize)}
              cancelModalOpen={Boolean(cancelModalOrderId)}
              cancelReasonInput={cancelReasonInput}
              cancelReasonError={cancelReasonError}
              onCancelReasonInputChange={(event) => {
                setCancelReasonInput(event.target.value);
                if (cancelReasonError) {
                  setCancelReasonError("");
                }
              }}
              onConfirmCancelOrder={confirmCancelOrder}
              onDismissCancelModal={closeCancelOrderModal}
              cancelModalSubmitting={Boolean(cancellingOrderId && cancelModalOrderId && cancellingOrderId === cancelModalOrderId)}
            />
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <OrderDetailsRoute
              formatPrice={formatPrice}
              onGoOrders={() => navigate("/orders")}
              onSessionInvalid={handleSessionInvalid}
              token={token}
            />
          }
        />
        <Route
          path="/store/item/:itemId"
          element={
            <ItemDetailRoute
              catalog={catalog}
              loadingCatalog={loadingCatalog}
              onAddToCartAndReturn={addToCartAndReturn}
              onGoNewProduct={openNewProductForm}
              onEditItem={viewProductEditor}
              onReturnToStore={goToStore}
              isProductManagementEnabled={isProductManager}
              totalLabel={formatPrice}
            />
          }
        />
        <Route
          path="/store/product/new"
          element={
            <ProductFormRoute
              mode="create"
              catalog={catalog}
              loadingCatalog={loadingCatalog}
              isProductManagementEnabled={isProductManager}
              onCreateProduct={createProduct}
              onUpdateProduct={updateProduct}
              onCancel={() => navigate("/store")}
              errorMessage={productFormError}
              isSubmitting={productFormSubmitting}
            />
          }
        />
        <Route
          path="/store/product/:itemId/edit"
          element={
            <ProductFormRoute
              mode="edit"
              catalog={catalog}
              loadingCatalog={loadingCatalog}
              isProductManagementEnabled={isProductManager}
              onCreateProduct={createProduct}
              onUpdateProduct={updateProduct}
              onCancel={() => navigate("/store")}
              errorMessage={productFormError}
              isSubmitting={productFormSubmitting}
            />
          }
        />
        <Route
          path="/help"
          element={
            <HelpPage onBack={() => navigate("/store")} showSimpleHeader={false} />
          }
        />
        <Route
          path="/admin/users"
          element={
            isAdmin
              ? <UserAdminPage onBack={() => navigate("/store")} token={token} />
              : <Navigate replace to="/store" />
          }
        />
        <Route
          path="/admin/users/:userId/edit"
          element={
            isAdmin
              ? <UserEditPage onBackToList={() => navigate("/admin/users")} token={token} />
              : <Navigate replace to="/store" />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              cardNumber={cardNumber}
              cart={cart}
              checkoutError={checkoutError}
              formatPrice={formatPrice}
              nameOnCard={nameOnCard}
              onCardChange={(event) =>
                setCardNumber(event.target.value.replace(/\D/g, ""))
              }
              street={checkoutAddress.street}
              city={checkoutAddress.city}
              postalCode={checkoutAddress.postalCode}
              country={checkoutAddress.country}
              onStreetChange={(event) => setCheckoutAddress((current) => ({ ...current, street: event.target.value }))}
              onCityChange={(event) => setCheckoutAddress((current) => ({ ...current, city: event.target.value }))}
              onPostalCodeChange={(event) => setCheckoutAddress((current) => ({ ...current, postalCode: event.target.value }))}
              onCountryChange={(event) => setCheckoutAddress((current) => ({ ...current, country: event.target.value }))}
              onNameChange={(event) => setNameOnCard(event.target.value)}
              onIncrementItem={incrementCartItem}
              onDecrementItem={decrementCartItem}
              onRemoveItem={removeCartItem}
              onSubmit={submitCheckout}
              orderId={orderId}
              orderMessage={orderMessage}
              totalCents={totalCents}
            />
          }
        />
        <Route path="*" element={<Navigate to="/store" replace />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <StoreApp />
      </BrowserRouter>
    </ThemeProvider>
  );
}
