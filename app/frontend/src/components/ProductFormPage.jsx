import { useEffect, useState } from "react";

export default function ProductFormPage({
  mode,
  item,
  itemId,
  loadingCatalog,
  canManageProducts,
  onSubmit,
  onCancel,
  errorMessage,
  isSubmitting
}) {
  const isEditMode = mode === "edit";
  const [header, setHeader] = useState(item?.header || item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.priceCents ? String(item.priceCents) : "");

  useEffect(() => {
    if (!isEditMode) {
      setHeader("");
      setDescription("");
      setPrice("");
      return;
    }
    setHeader(item?.header || item?.name || "");
    setDescription(item?.description || "");
    setPrice(item?.priceCents ? String(item.priceCents) : "");
  }, [isEditMode, item]);

  if (!canManageProducts) {
    return (
      <section className="card" data-cy="product-form-forbidden">
        <h2>Editor access required</h2>
        <p>Only editors can create or edit products.</p>
        <button data-cy="product-form-cancel" onClick={onCancel} type="button">
          Return to catalog
        </button>
      </section>
    );
  }

  if (isEditMode && loadingCatalog && !item) {
    return (
      <section className="card" data-cy="product-form-loading">
        <h2>Edit product</h2>
        <p>Loading...</p>
      </section>
    );
  }

  if (isEditMode && !item) {
    return (
      <section className="card" data-cy="product-form-not-found">
        <h2>Product not found</h2>
        <p>No catalog item exists for id "{itemId}".</p>
        <button data-cy="product-form-cancel" onClick={onCancel} type="button">
          Return to catalog
        </button>
      </section>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      header,
      description,
      priceCents: Number(price)
    });
  }

  return (
    <section className="card" data-cy="product-form-page">
      <h2 data-cy="product-form-title">{isEditMode ? "Edit product" : "New product"}</h2>
      <form data-cy="product-form" onSubmit={handleSubmit}>
        <label htmlFor="productHeader">Header</label>
        <input
          id="productHeader"
          name="productHeader"
          data-cy="product-form-header"
          value={header}
          onChange={(event) => setHeader(event.target.value)}
        />

        <label htmlFor="productDescription">Description</label>
        <input
          id="productDescription"
          name="productDescription"
          data-cy="product-form-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <label htmlFor="productPrice">Price (cents)</label>
        <input
          id="productPrice"
          name="productPrice"
          data-cy="product-form-price"
          value={price}
          onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))}
        />

        <div className="row-actions">
          <button data-cy="product-form-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : "Save product"}
          </button>
          <button data-cy="product-form-cancel" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </form>

      {errorMessage ? <p data-cy="product-form-error">{errorMessage}</p> : null}
    </section>
  );
}
