export default function StorePage({
  loadingCatalog,
  catalog,
  cart,
  totalLabel,
  onAddToCart,
  onViewItem,
  onEditItem,
  onGoCheckout,
  isProductManagementEnabled,
  pagination,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
  onPageSizeChange
}) {
  const {
    currentPage = 1,
    totalPages = 1,
    pageSize = 10,
    totalItems = 0
  } = pagination || {};
  const disablePrev = currentPage <= 1 || totalItems <= pageSize;
  const disableNext = currentPage >= totalPages || totalItems <= pageSize;

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
        <div className="row-actions" data-cy="catalog-pagination">
          <label htmlFor="catalog-page-size">Page size</label>
          <select
            data-cy="catalog-page-size"
            id="catalog-page-size"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={String(pageSize)}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <button data-cy="catalog-page-first" disabled={disablePrev} onClick={onFirstPage} type="button">
            First
          </button>
          <button data-cy="catalog-page-prev" disabled={disablePrev} onClick={onPrevPage} type="button">
            Previous
          </button>
          <span data-cy="catalog-page-indicator">Page {currentPage} of {totalPages}</span>
          <button data-cy="catalog-page-next" disabled={disableNext} onClick={onNextPage} type="button">
            Next
          </button>
          <button data-cy="catalog-page-last" disabled={disableNext} onClick={onLastPage} type="button">
            Last
          </button>
        </div>
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
