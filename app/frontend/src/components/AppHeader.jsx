export default function AppHeader({
  userEmail,
  onGoStore,
  onGoCheckout,
  onGoHelp,
  onGoNewProduct,
  onLogout,
  isCheckoutEnabled,
  isProductManagementEnabled
}) {
  return (
    <header className="row-between">
      <h1 data-cy="dashboard-title">My Store</h1>
      <p data-cy="session-user-email">{userEmail || "unknown user"}</p>
      <div className="row-between">
        <button data-cy="nav-store" onClick={onGoStore} type="button">
          Store
        </button>
        <button
          data-cy="nav-checkout"
          disabled={!isCheckoutEnabled}
          onClick={onGoCheckout}
          type="button"
        >
          Checkout
        </button>
        {isProductManagementEnabled ? (
          <button
            data-cy="nav-new-product"
            onClick={onGoNewProduct}
            type="button"
          >
            New product
          </button>
        ) : null}
      </div>
      <button data-cy="logout-button" onClick={onLogout} type="button">
        Logout
      </button>
      <button data-cy="nav-help" onClick={onGoHelp} type="button">
        Help
      </button>
    </header>
  );
}
