import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PaymentIcon from "@mui/icons-material/Payment";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  onIncrementItem,
  onDecrementItem,
  onRemoveItem,
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
          <Table data-cy="cart-list" size="small" sx={{ mb: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cart.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography data-cy={`cart-item-${item.id}`}>{item.name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography data-cy={`checkout-item-quantity-${item.id}`}>{item.quantity}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography data-cy={`checkout-item-subtotal-${item.id}`}>
                      {formatPrice(item.priceCents * item.quantity)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <IconButton
                        aria-label={`Decrease quantity for ${item.name}`}
                        data-cy={`checkout-item-dec-${item.id}`}
                        onClick={() => onDecrementItem(item.id)}
                        size="small"
                        type="button"
                      >
                        <RemoveCircleOutlineIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`Increase quantity for ${item.name}`}
                        data-cy={`checkout-item-inc-${item.id}`}
                        onClick={() => onIncrementItem(item.id)}
                        size="small"
                        type="button"
                      >
                        <AddCircleOutlineIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`Remove ${item.name} from cart`}
                        data-cy={`checkout-item-delete-${item.id}`}
                        onClick={() => onRemoveItem(item.id)}
                        size="small"
                        type="button"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
