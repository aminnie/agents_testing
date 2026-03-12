import { Card, CardContent, CircularProgress, List, ListItem, Stack, Typography } from "@mui/material";

function formatOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
}

export default function OrdersPage({ loading, errorMessage, orders, formatPrice }) {
  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Card>
        <CardContent>
          <Typography data-cy="orders-page-title" sx={{ mb: 2 }} variant="h5">
            Previous Orders
          </Typography>
          {loading ? (
            <Stack data-cy="orders-loading" direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading orders...</Typography>
            </Stack>
          ) : null}
          {errorMessage ? (
            <Typography color="error" data-cy="orders-error" sx={{ mb: 2 }} variant="body2">
              {errorMessage}
            </Typography>
          ) : null}
          {!loading && !errorMessage && orders.length === 0 ? (
            <Typography data-cy="orders-empty" variant="body2">
              No previous orders
            </Typography>
          ) : null}
          {!loading && !errorMessage && orders.length > 0 ? (
            <List data-cy="orders-list" sx={{ p: 0 }}>
              {orders.map((order) => (
                <ListItem data-cy={`orders-item-${order.orderId}`} divider key={order.orderId} sx={{ px: 0 }}>
                  <Stack spacing={0.5}>
                    <Typography data-cy={`orders-id-${order.orderId}`} variant="body1">
                      Order #{order.orderId}
                    </Typography>
                    <Typography data-cy={`orders-date-${order.orderId}`} variant="body2">
                      Date: {formatOrderDate(order.createdAt)}
                    </Typography>
                    <Typography data-cy={`orders-total-${order.orderId}`} variant="body2">
                      Total: {formatPrice(order.totalCents)}
                    </Typography>
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}
