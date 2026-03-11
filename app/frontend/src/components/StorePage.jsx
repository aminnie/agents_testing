import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItem,
  NativeSelect,
  Stack,
  TextField,
  Typography
} from "@mui/material";

export default function StorePage({
  loadingCatalog,
  catalogError,
  catalog,
  searchInput,
  searchError,
  isSearchActive,
  cart,
  totalLabel,
  onAddToCart,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
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
            <Typography variant="h5">Catalog</Typography>
            <Box component="form" data-cy="catalog-search-form" onSubmit={onSearchSubmit} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  inputProps={{
                    "data-cy": "catalog-search-input",
                    maxLength: 20
                  }}
                  label="Search items"
                  onChange={onSearchInputChange}
                  size="small"
                  value={searchInput}
                />
                <Button data-cy="catalog-search-submit" type="submit" variant="contained">
                  Search
                </Button>
                <Button
                  data-cy="catalog-search-clear"
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
          {loadingCatalog ? (
            <Box data-cy="catalog-loading" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading...</Typography>
            </Box>
          ) : null}
          {searchError ? (
            <Typography color="error" data-cy="catalog-search-error" sx={{ mb: 2 }} variant="body2">
              {searchError}
            </Typography>
          ) : null}
          {catalogError ? (
            <Typography color="error" data-cy="catalog-error" sx={{ mb: 2 }} variant="body2">
              {catalogError}
            </Typography>
          ) : null}
          {!loadingCatalog && !catalogError && isSearchActive && catalog.length === 0 ? (
            <Typography data-cy="catalog-no-results" sx={{ mb: 2 }} variant="body2">
              No results
            </Typography>
          ) : null}
          <List data-cy="catalog-list" sx={{ p: 0 }}>
          {catalog.map((item) => (
            <ListItem
              divider
              key={item.id}
              sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 2 }}
            >
              <Typography data-cy={`catalog-item-${item.id}`} sx={{ fontWeight: 500 }} variant="body1">
                {item.header || item.name} - {totalLabel(item.priceCents)}
              </Typography>
              <Stack direction="row" spacing={1}>
                {isProductManagementEnabled ? (
                  <Button
                    data-cy={`catalog-edit-${item.id}`}
                    onClick={() => onEditItem(item.id)}
                    size="small"
                    startIcon={<EditIcon />}
                    type="button"
                    variant="outlined"
                  >
                    Edit product
                  </Button>
                ) : null}
                <Button
                  data-cy={`catalog-view-${item.id}`}
                  onClick={() => onViewItem(item.id)}
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  type="button"
                  variant="outlined"
                >
                  View item
                </Button>
                <Button
                  data-cy={`catalog-add-${item.id}`}
                  onClick={() => onAddToCart(item)}
                  size="small"
                  startIcon={<AddShoppingCartIcon />}
                  type="button"
                >
                  Add to cart
                </Button>
              </Stack>
            </ListItem>
          ))}
          </List>
          <Stack
            alignItems="center"
            data-cy="catalog-pagination"
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", mt: 2 }}
          >
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel htmlFor="catalog-page-size-native" id="catalog-page-size-label">Page size</InputLabel>
              <NativeSelect
                id="catalog-page-size"
                inputProps={{
                  "aria-label": "Page size",
                  "data-cy": "catalog-page-size",
                  id: "catalog-page-size-native"
                }}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                value={String(pageSize)}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </NativeSelect>
            </FormControl>
            <Button data-cy="catalog-page-first" disabled={disablePrev} onClick={onFirstPage} type="button" variant="outlined">
              First
            </Button>
            <Button data-cy="catalog-page-prev" disabled={disablePrev} onClick={onPrevPage} type="button" variant="outlined">
              Previous
            </Button>
            <Typography data-cy="catalog-page-indicator" sx={{ fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </Typography>
            <Button data-cy="catalog-page-next" disabled={disableNext} onClick={onNextPage} type="button" variant="outlined">
              Next
            </Button>
            <Button data-cy="catalog-page-last" disabled={disableNext} onClick={onLastPage} type="button" variant="outlined">
              Last
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography sx={{ mb: 2 }} variant="h5">Cart</Typography>
          {cart.length === 0 ? <Typography data-cy="cart-empty">Cart is empty</Typography> : null}
          <List data-cy="cart-list" sx={{ p: 0 }}>
            {cart.map((item) => (
              <ListItem key={item.id} sx={{ px: 0 }}>
                <Typography data-cy={`cart-item-${item.id}`}>
                  {(item.header || item.name)} x {item.quantity}
                </Typography>
              </ListItem>
            ))}
          </List>
          <Typography data-cy="cart-total" sx={{ fontWeight: 600 }}>
            Total: {totalLabel(cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0))}
          </Typography>
          <Button data-cy="go-to-checkout" onClick={onGoCheckout} startIcon={<ShoppingCartCheckoutIcon />} type="button">
            Go to checkout
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
