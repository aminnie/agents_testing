import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";

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
      <Card data-cy="item-detail-loading" sx={{ mt: 2 }}>
        <CardContent>
          <Typography gutterBottom variant="h5">Item details</Typography>
          <Stack alignItems="center" direction="row" spacing={1}>
            <CircularProgress size={18} />
            <Typography>Loading...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!item) {
    return (
      <Card data-cy="item-detail-not-found" sx={{ mt: 2 }}>
        <CardContent>
          <Typography gutterBottom variant="h5">Item not found</Typography>
          <Typography sx={{ mb: 2 }}>No catalog item exists for id "{itemId}".</Typography>
          <Button data-cy="item-detail-return" onClick={onReturnToStore} startIcon={<ArrowBackIcon />} type="button">
            Return to catalog
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-cy="item-detail-page" sx={{ mt: 2 }}>
      <CardContent>
        <Typography data-cy="item-detail-header" gutterBottom variant="h5">{item.header || item.name}</Typography>
        <Typography data-cy="item-detail-description" sx={{ mb: 1 }}>{item.description}</Typography>
        <Typography data-cy="item-detail-price" sx={{ fontWeight: 600 }}>
          Price: {totalLabel(item.priceCents)}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
        {isProductManagementEnabled ? (
          <Button
            data-cy="item-detail-new-product"
            onClick={onGoNewProduct}
            startIcon={<AddCircleOutlineIcon />}
            type="button"
            variant="outlined"
          >
            New product
          </Button>
        ) : null}
        {isProductManagementEnabled ? (
          <Button
            data-cy="item-detail-edit-product"
            onClick={() => onEditItem(item.id)}
            startIcon={<EditIcon />}
            type="button"
            variant="outlined"
          >
            Edit product
          </Button>
        ) : null}
        <Button
          data-cy="item-detail-add-and-return"
          onClick={() => onAddToCartAndReturn(item)}
          startIcon={<AddShoppingCartIcon />}
          type="button"
        >
          Add to cart and return
        </Button>
        <Button data-cy="item-detail-return" onClick={onReturnToStore} startIcon={<ArrowBackIcon />} type="button" variant="outlined">
          Return to catalog
        </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
