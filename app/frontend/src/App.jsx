import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import AppHeader from "./components/AppHeader.jsx";
import CheckoutPage from "./components/CheckoutPage.jsx";
import ItemDetailPage from "./components/ItemDetailPage.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import ProductFormPage from "./components/ProductFormPage.jsx";
import StorePage from "./components/StorePage.jsx";

const STORAGE_KEYS = Object.freeze({
  auth: ["store", "auth", "state"].join("-"),
  user: ["store", "user", "state"].join("-")
});
const PRODUCT_MANAGEMENT_TOOLTIP = "Editor role required to manage products.";

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
      productManagementTooltip={PRODUCT_MANAGEMENT_TOOLTIP}
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

function StoreApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("CorrectHorseBatteryStaple1!");
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.auth) || "");
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderMessage, setOrderMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [productFormSubmitting, setProductFormSubmitting] = useState(false);
  const isEditor = currentUser?.role === "editor";

  const totalCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [cart]
  );

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.user);
    setToken("");
    setCurrentUser(null);
    setCatalog([]);
    setCart([]);
    setOrderMessage("");
    setCheckoutError("");
    setNameOnCard("");
    setCardNumber("");
  }

  useEffect(() => {
    if (!token && location.pathname !== "/") {
      navigate("/", { replace: true });
      return;
    }

    if (token && location.pathname === "/") {
      navigate("/store", { replace: true });
    }
  }, [token, location.pathname, navigate]);

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoadingCatalog(true);
    fetch("/api/catalog", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("SESSION_INVALID");
        }
        return response.json();
      })
      .then((data) => setCatalog(data.items || []))
      .catch(() => {
        clearSession();
        setAuthError("Session expired. Please sign in again.");
      })
      .finally(() => setLoadingCatalog(false));
  }, [token]);

  function persistAuth(nextToken, user) {
    localStorage.setItem(STORAGE_KEYS.auth, nextToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    setToken(nextToken);
    setCurrentUser(user);
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

  function logout() {
    clearSession();
    setPassword("");
    setAuthError("");
    navigate("/", { replace: true });
  }

  function addToCart(item) {
    setOrderMessage("");
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

  function viewItem(itemId) {
    navigate(`/store/item/${encodeURIComponent(itemId)}`);
  }

  function addToCartAndReturn(item) {
    addToCart(item);
    navigate("/store");
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

    const formData = new FormData(event.currentTarget);
    const submittedName = String(formData.get("nameOnCard") || "")
      .trim();
    const submittedCard = String(formData.get("cardNumber") || "")
      .replace(/\D/g, "");

    // Keep state synchronized with the submitted values (including autofill/manual browser fills).
    setNameOnCard(submittedName);
    setCardNumber(submittedCard);

    if (cart.length === 0) {
      setCheckoutError("Cart cannot be empty");
      return;
    }

    if (!submittedName || submittedCard.length <= 4) {
      setCheckoutError("Payment details are required");
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
        }
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setCheckoutError(payload.message || "Checkout failed");
      return;
    }

    setOrderMessage(`Order confirmed (#${payload.orderId})`);
    setCart([]);
    setNameOnCard("");
    setCardNumber("");
  }

  if (!token) {
    return (
      <LoginScreen
        authError={authError}
        email={email}
        onEmailChange={(event) => setEmail(event.target.value)}
        onPasswordChange={(event) => setPassword(event.target.value)}
        onSubmit={onLoginSubmit}
        password={password}
      />
    );
  }

  return (
    <main className="container">
      <AppHeader
        isCheckoutEnabled={cart.length > 0}
        onGoCheckout={() => navigate("/checkout")}
        onGoNewProduct={openNewProductForm}
        onGoStore={() => navigate("/store")}
        onLogout={logout}
        isProductManagementEnabled={isEditor}
        productManagementTooltip={PRODUCT_MANAGEMENT_TOOLTIP}
        userEmail={currentUser?.email}
      />

      <Routes>
        <Route
          path="/store"
          element={
            <StorePage
              cart={cart}
              catalog={catalog}
              loadingCatalog={loadingCatalog}
              onAddToCart={addToCart}
              onEditItem={viewProductEditor}
              onGoNewProduct={openNewProductForm}
              onViewItem={viewItem}
              onGoCheckout={() => navigate("/checkout")}
              isProductManagementEnabled={isEditor}
              productManagementTooltip={PRODUCT_MANAGEMENT_TOOLTIP}
              totalLabel={formatPrice}
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
              onReturnToStore={() => navigate("/store")}
              isProductManagementEnabled={isEditor}
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
              isProductManagementEnabled={isEditor}
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
              isProductManagementEnabled={isEditor}
              onCreateProduct={createProduct}
              onUpdateProduct={updateProduct}
              onCancel={() => navigate("/store")}
              errorMessage={productFormError}
              isSubmitting={productFormSubmitting}
            />
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
              onNameChange={(event) => setNameOnCard(event.target.value)}
              onSubmit={submitCheckout}
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
    <BrowserRouter>
      <StoreApp />
    </BrowserRouter>
  );
}
