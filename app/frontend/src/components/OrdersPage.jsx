import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  NativeSelect,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/material/Link";

function formatOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
}

export default function OrdersPage({
  loading,
  errorMessage,
  orders,
  formatPrice,
  onCancelOrder,
  cancellingOrderId,
  searchInput,
  searchError,
  isSearchActive,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  pagination,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
  onPageSizeChange,
  cancelModalOpen,
  cancelReasonInput,
  cancelReasonError,
  onCancelReasonInputChange,
  onConfirmCancelOrder,
  onDismissCancelModal,
  cancelModalSubmitting
}) {
  const isCancelableStatus = (status) => ["Ordered", "Processing"].includes(String(status || ""));
  const {
    currentPage = 1,
    totalPages = 1,
    pageSize = 10,
    totalItems = 0
  } = pagination || {};
  const disablePrev = currentPage <= 1 || totalItems <= pageSize;
  const disableNext = currentPage >= totalPages || totalItems <= pageSize;

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Card>
        <CardContent>
          <Stack
            alignItems={{ xs: "stretch", md: "center" }}
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Typography data-cy="orders-page-title" variant="h5">
              Previous Orders
            </Typography>
            <Box component="form" data-cy="orders-search-form" onSubmit={onSearchSubmit} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  inputProps={{
                    "data-cy": "orders-search-input",
                    maxLength: 60
                  }}
                  label="Search orders"
                  onChange={onSearchInputChange}
                  size="small"
                  value={searchInput}
                />
                <Button data-cy="orders-search-submit" type="submit" variant="contained">
                  Search
                </Button>
                <Button
                  data-cy="orders-search-clear"
                  disabled={!isSearchActive && !searchInput}
                  onClick={onClearSearch}
                  type="button"
                  variant="outlined"
                >
                  Clear
                </Button>
              </Stack>
            </Box>
          </Stack>
          {loading ? (
            <Stack data-cy="orders-loading" direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading orders...</Typography>
            </Stack>
          ) : null}
          {searchError ? (
            <Typography color="error" data-cy="orders-search-error" sx={{ mb: 2 }} variant="body2">
              {searchError}
            </Typography>
          ) : null}
          {errorMessage ? (
            <Typography color="error" data-cy="orders-error" sx={{ mb: 2 }} variant="body2">
              {errorMessage}
            </Typography>
          ) : null}
          {!loading && !errorMessage && !isSearchActive && orders.length === 0 ? (
            <Typography data-cy="orders-empty" variant="body2">
              No previous orders
            </Typography>
          ) : null}
          {!loading && !errorMessage && isSearchActive && orders.length === 0 ? (
            <Typography data-cy="orders-no-results" variant="body2">
              No matching orders
            </Typography>
          ) : null}
          {!loading && !errorMessage && orders.length > 0 ? (
            <List data-cy="orders-list" sx={{ p: 0 }}>
              {orders.map((order) => (
                <ListItem data-cy={`orders-item-${order.orderId}`} divider key={order.orderId} sx={{ px: 0 }}>
                  <Stack spacing={0.5}>
                    <Typography data-cy={`orders-id-${order.orderId}`} variant="body1">
                      <Link
                        component={RouterLink}
                        data-cy={`orders-link-${order.orderId}`}
                        to={`/orders/${encodeURIComponent(order.orderId)}`}
                        underline="hover"
                      >
                        Order #{order.orderId}
                      </Link>
                    </Typography>
                    <Typography data-cy={`orders-date-${order.orderId}`} variant="body2">
                      Date: {formatOrderDate(order.createdAt)}
                    </Typography>
                    <Typography data-cy={`orders-total-${order.orderId}`} variant="body2">
                      Total: {formatPrice(order.totalCents)}
                    </Typography>
                    <Typography data-cy={`orders-status-${order.orderId}`} variant="body2">
                      Status: {order.status || "Ordered"}
                    </Typography>
                    {isCancelableStatus(order.status) ? (
                      <Button
                        data-cy={`orders-cancel-${order.orderId}`}
                        size="small"
                        variant="outlined"
                        onClick={() => onCancelOrder?.(order.orderId)}
                        disabled={cancellingOrderId === order.orderId}
                      >
                        {cancellingOrderId === order.orderId ? "Cancelling..." : "Cancel order"}
                      </Button>
                    ) : null}
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : null}
          <Stack
            alignItems="center"
            data-cy="orders-pagination"
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", mt: 2 }}
          >
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel htmlFor="orders-page-size-native" id="orders-page-size-label">Page size</InputLabel>
              <NativeSelect
                id="orders-page-size"
                inputProps={{
                  "aria-label": "Page size",
                  "data-cy": "orders-page-size",
                  id: "orders-page-size-native"
                }}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                value={String(pageSize)}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
              </NativeSelect>
            </FormControl>
            <Button data-cy="orders-page-first" disabled={disablePrev} onClick={onFirstPage} type="button" variant="outlined">
              First
            </Button>
            <Button data-cy="orders-page-prev" disabled={disablePrev} onClick={onPrevPage} type="button" variant="outlined">
              Previous
            </Button>
            <Typography data-cy="orders-page-indicator" sx={{ fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </Typography>
            <Button data-cy="orders-page-next" disabled={disableNext} onClick={onNextPage} type="button" variant="outlined">
              Next
            </Button>
            <Button data-cy="orders-page-last" disabled={disableNext} onClick={onLastPage} type="button" variant="outlined">
              Last
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Dialog
        aria-labelledby="orders-cancel-modal-title"
        data-cy="orders-cancel-modal"
        fullWidth
        maxWidth="sm"
        onClose={onDismissCancelModal}
        open={cancelModalOpen}
      >
        <DialogTitle id="orders-cancel-modal-title">Cancel order</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Please provide a reason for cancelling this order.
            </Typography>
            <TextField
              data-cy="orders-cancel-reason-input"
              error={Boolean(cancelReasonError)}
              helperText={cancelReasonError || "Required"}
              inputProps={{ maxLength: 300 }}
              label="Cancellation reason"
              multiline
              minRows={3}
              onChange={onCancelReasonInputChange}
              value={cancelReasonInput}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            data-cy="orders-cancel-modal-cancel"
            disabled={cancelModalSubmitting}
            onClick={onDismissCancelModal}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            data-cy="orders-cancel-modal-proceed"
            disabled={cancelModalSubmitting || !String(cancelReasonInput || "").trim()}
            onClick={onConfirmCancelOrder}
            type="button"
            variant="contained"
          >
            {cancelModalSubmitting ? "Cancelling..." : "Proceed"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
