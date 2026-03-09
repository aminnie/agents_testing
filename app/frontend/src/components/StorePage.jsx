export default function StorePage({
  loadingCatalog,
  catalog,
  cart,
  totalLabel,
  onAddToCart,
  onViewItem,
  onEditItem,
  onGoCheckout,
  isProductManagementEnabled
}) {
  return (
    <>
      <section className="card">
        <h2>Catalog</h2>
        {loadingCatalog ? <p data-cy="catalog-loading">Loading...</p> : null}
        <ul data-cy="catalog-list">
          {catalog.map((item) => (
            <li className="row-between" key={item.id}>
              <span data-cy={`catalog-item-${item.id}`}>
                {item.header || item.name} - {totalLabel(item.priceCents)}
              </span>
              <div className="row-actions">
                {isProductManagementEnabled ? (
                  <button
                    data-cy={`catalog-edit-${item.id}`}
                    onClick={() => onEditItem(item.id)}
                    type="button"
                  >
                    Edit product
                  </button>
                ) : null}
                <button data-cy={`catalog-view-${item.id}`} onClick={() => onViewItem(item.id)} type="button">
                  View item
                </button>
                <button data-cy={`catalog-add-${item.id}`} onClick={() => onAddToCart(item)} type="button">
                  Add to cart
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Cart</h2>
        {cart.length === 0 ? <p data-cy="cart-empty">Cart is empty</p> : null}
        <ul data-cy="cart-list">
          {cart.map((item) => (
            <li key={item.id}>
              <span data-cy={`cart-item-${item.id}`}>
                {(item.header || item.name)} x {item.quantity}
              </span>
            </li>
          ))}
        </ul>
        <p data-cy="cart-total">Total: {totalLabel(cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0))}</p>
        <button data-cy="go-to-checkout" onClick={onGoCheckout} type="button">
          Go to checkout
        </button>
      </section>
    </>
  );
}
