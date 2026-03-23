import { Button, Card, CardContent, CircularProgress, Divider, List, ListItem, Stack, Typography } from "@mui/material";

function formatOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
}

export default function OrderDetailsPage({
  loading,
  errorMessage,
  order,
  items,
  formatPrice,
  onGoOrders
}) {
  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Card>
        <CardContent>
          <Typography data-cy="order-details-page-title" sx={{ mb: 2 }} variant="h5">
            Order details
          </Typography>
          {loading ? (
            <Stack data-cy="order-details-loading" direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <CircularProgress aria-label="Loading order details" size={18} />
              <Typography variant="body2">Loading order details...</Typography>
            </Stack>
          ) : null}
          {!loading && errorMessage ? (
            <Typography color="error" data-cy="order-details-error" sx={{ mb: 2 }} variant="body2">
              {errorMessage}
            </Typography>
          ) : null}
          {!loading && !errorMessage && order ? (
            <Stack spacing={1.25}>
              <Typography data-cy="order-details-id" variant="body1">
                Order #{order.orderId}
              </Typography>
              <Typography data-cy="order-details-date" variant="body2">
                Date: {formatOrderDate(order.createdAt)}
              </Typography>
              <Typography data-cy="order-details-total" variant="body2">
                Total: {formatPrice(order.totalCents)}
              </Typography>
              <Typography data-cy="order-details-status" variant="body2">
                Status: {order.status || "Ordered"}
              </Typography>
              <Button data-cy="order-details-back-to-orders" onClick={onGoOrders} size="small" sx={{ alignSelf: "flex-start" }}>
                Back to orders
              </Button>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1">Shipping</Typography>
              <Typography data-cy="order-details-shipping" variant="body2">
                {order.shipping?.street || ""}, {order.shipping?.city || ""}, {order.shipping?.postalCode || ""},{" "}
                {order.shipping?.country || ""}
              </Typography>
              <Typography variant="subtitle1">Payment summary</Typography>
              <Typography data-cy="order-details-payment" variant="body2">
                {order.paymentSummary?.nameOnCard || "Cardholder unavailable"} - ending in {order.paymentSummary?.last4 || "N/A"}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1">Items</Typography>
              {items.length === 0 ? (
                <Typography data-cy="order-details-items-empty" variant="body2">
                  No order items found
                </Typography>
              ) : (
                <List data-cy="order-details-items-list" sx={{ p: 0 }}>
                  {items.map((item, index) => (
                    <ListItem
                      data-cy={`order-details-item-${index}`}
                      divider
                      key={`${item.itemId || "item"}-${index}`}
                      sx={{ px: 0 }}
                    >
                      <Stack spacing={0.5}>
                        <Typography data-cy={`order-details-item-name-${index}`} variant="body2">
                          {item.headerOrName}
                        </Typography>
                        <Typography data-cy={`order-details-item-qty-${index}`} variant="body2">
                          Qty: {item.quantity}
                        </Typography>
                        <Typography data-cy={`order-details-item-unit-price-${index}`} variant="body2">
                          Unit: {formatPrice(item.unitPriceCents)}
                        </Typography>
                        <Typography data-cy={`order-details-item-line-total-${index}`} variant="body2">
                          Subtotal: {formatPrice(item.lineTotalCents)}
                        </Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}
