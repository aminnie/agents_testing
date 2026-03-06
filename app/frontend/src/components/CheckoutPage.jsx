export default function CheckoutPage({
  cart,
  totalCents,
  formatPrice,
  nameOnCard,
  cardNumber,
  onNameChange,
  onCardChange,
  onSubmit,
  checkoutError,
  orderMessage
}) {
  if (orderMessage) {
    return (
      <section className="card">
        <h2 data-cy="checkout-page-title">Checkout complete</h2>
        <p data-cy="checkout-success">{orderMessage}</p>
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <h2 data-cy="checkout-page-title">Checkout</h2>
        <ul data-cy="cart-list">
          {cart.map((item) => (
            <li key={item.id}>
              <span data-cy={`cart-item-${item.id}`}>
                {item.name} x {item.quantity}
              </span>
            </li>
          ))}
        </ul>
        {cart.length === 0 ? <p data-cy="cart-empty">Cart is empty</p> : null}
        <p data-cy="cart-total">Total: {formatPrice(totalCents)}</p>
      </section>
      <section className="card">
        <h2>Payment</h2>
        <form data-cy="checkout-form" onSubmit={onSubmit}>
          <label htmlFor="nameOnCard">Name on card</label>
          <input
            id="nameOnCard"
            name="nameOnCard"
            data-cy="checkout-name"
            autoComplete="cc-name"
            value={nameOnCard}
            onChange={onNameChange}
          />

          <label htmlFor="cardNumber">Card number</label>
          <input
            id="cardNumber"
            name="cardNumber"
            data-cy="checkout-card"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={onCardChange}
          />

          <button data-cy="checkout-submit" type="submit">
            Confirm order
          </button>
        </form>

        {checkoutError ? <p data-cy="checkout-error">{checkoutError}</p> : null}
        {orderMessage ? <p data-cy="checkout-success">{orderMessage}</p> : null}
      </section>
    </>
  );
}
