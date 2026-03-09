export default function ItemDetailPage({
  item,
  itemId,
  loadingCatalog,
  totalLabel,
  onAddToCartAndReturn,
  onReturnToStore,
  onGoNewProduct,
  onEditItem,
  isProductManagementEnabled
}) {
  if (loadingCatalog && !item) {
    return (
      <section className="card" data-cy="item-detail-loading">
        <h2>Item details</h2>
        <p>Loading...</p>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="card" data-cy="item-detail-not-found">
        <h2>Item not found</h2>
        <p>No catalog item exists for id "{itemId}".</p>
        <button data-cy="item-detail-return" onClick={onReturnToStore} type="button">
          Return to catalog
        </button>
      </section>
    );
  }

  return (
    <section className="card" data-cy="item-detail-page">
      <h2 data-cy="item-detail-header">{item.header || item.name}</h2>
      <p data-cy="item-detail-description">{item.description}</p>
      <p data-cy="item-detail-price">Price: {totalLabel(item.priceCents)}</p>
      <div className="row-actions">
        {isProductManagementEnabled ? (
          <button
            data-cy="item-detail-new-product"
            onClick={onGoNewProduct}
            type="button"
          >
            New product
          </button>
        ) : null}
        {isProductManagementEnabled ? (
          <button
            data-cy="item-detail-edit-product"
            onClick={() => onEditItem(item.id)}
            type="button"
          >
            Edit product
          </button>
        ) : null}
        <button data-cy="item-detail-add-and-return" onClick={() => onAddToCartAndReturn(item)} type="button">
          Add to cart and return
        </button>
        <button data-cy="item-detail-return" onClick={onReturnToStore} type="button">
          Return to catalog
        </button>
      </div>
    </section>
  );
}
