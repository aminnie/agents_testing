import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PaymentIcon from "@mui/icons-material/Payment";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Link,
  List,
  ListItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";

export default function CheckoutPage({
  cart,
  totalCents,
  formatPrice,
  street,
  city,
  postalCode,
  country,
  nameOnCard,
  cardNumber,
  onStreetChange,
  onCityChange,
  onPostalCodeChange,
  onCountryChange,
  onNameChange,
  onCardChange,
  onSubmit,
  checkoutError,
  orderMessage,
  orderId
}) {
  if (orderMessage) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography data-cy="checkout-page-title" gutterBottom variant="h5">Checkout complete</Typography>
          <Alert data-cy="checkout-success" icon={<CheckCircleOutlineIcon />} severity="success">
            {orderId ? (
              <>
                Order confirmed (
                <Link
                  component={RouterLink}
                  data-cy="checkout-order-link"
                  to={`/orders/${encodeURIComponent(orderId)}`}
                  underline="hover"
                >
                  #{orderId}
                </Link>
                )
              </>
            ) : orderMessage}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Card>
        <CardContent>
          <Typography data-cy="checkout-page-title" gutterBottom variant="h5">Checkout</Typography>
          <List data-cy="cart-list" sx={{ p: 0 }}>
          {cart.map((item) => (
            <ListItem key={item.id} sx={{ px: 0 }}>
              <Typography data-cy={`cart-item-${item.id}`}>
                {item.name} x {item.quantity}
              </Typography>
            </ListItem>
          ))}
          </List>
          {cart.length === 0 ? <Typography data-cy="cart-empty">Cart is empty</Typography> : null}
          <Typography data-cy="cart-total" sx={{ fontWeight: 600 }}>
            Total: {formatPrice(totalCents)}
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h5">Payment</Typography>
          <Stack component="form" data-cy="checkout-form" onSubmit={onSubmit} spacing={2}>
            <TextField
              id="street"
              name="street"
              autoComplete="address-line1"
              inputProps={{ "data-cy": "checkout-street" }}
              label="Street"
              onChange={onStreetChange}
              value={street}
            />
            <TextField
              id="city"
              name="city"
              autoComplete="address-level2"
              inputProps={{ "data-cy": "checkout-city" }}
              label="City"
              onChange={onCityChange}
              value={city}
            />
            <TextField
              id="postalCode"
              name="postalCode"
              autoComplete="postal-code"
              inputProps={{ "data-cy": "checkout-postal-code" }}
              label="Zip/Postal code"
              onChange={onPostalCodeChange}
              value={postalCode}
            />
            <TextField
              id="country"
              name="country"
              autoComplete="country-name"
              inputProps={{ "data-cy": "checkout-country" }}
              label="Country"
              onChange={onCountryChange}
              value={country}
            />
            <TextField
            id="nameOnCard"
            name="nameOnCard"
            autoComplete="cc-name"
              inputProps={{ "data-cy": "checkout-name" }}
              label="Name on card"
            value={nameOnCard}
            onChange={onNameChange}
          />
            <TextField
            id="cardNumber"
            name="cardNumber"
            autoComplete="cc-number"
              inputProps={{ "data-cy": "checkout-card" }}
              label="Card number"
            value={cardNumber}
            onChange={onCardChange}
          />
            <Button data-cy="checkout-submit" startIcon={<PaymentIcon />} type="submit">
              Confirm order
            </Button>
          </Stack>
          {checkoutError ? <Alert data-cy="checkout-error" severity="error" sx={{ mt: 2 }}>{checkoutError}</Alert> : null}
          {orderMessage ? <Alert data-cy="checkout-success" severity="success" sx={{ mt: 2 }}>{orderMessage}</Alert> : null}
        </CardContent>
      </Card>
    </Stack>
  );
}
