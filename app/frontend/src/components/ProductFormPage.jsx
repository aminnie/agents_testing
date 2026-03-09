import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { Alert, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from "@mui/material";

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
      <Card data-cy="product-form-forbidden" sx={{ mt: 2 }}>
        <CardContent>
          <Typography gutterBottom variant="h5">Editor access required</Typography>
          <Typography sx={{ mb: 2 }}>Only editors can create or edit products.</Typography>
          <Button data-cy="product-form-cancel" onClick={onCancel} startIcon={<ArrowBackIcon />} type="button">
            Return to catalog
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditMode && loadingCatalog && !item) {
    return (
      <Card data-cy="product-form-loading" sx={{ mt: 2 }}>
        <CardContent>
          <Typography gutterBottom variant="h5">Edit product</Typography>
          <Stack alignItems="center" direction="row" spacing={1}>
            <CircularProgress size={18} />
            <Typography>Loading...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (isEditMode && !item) {
    return (
      <Card data-cy="product-form-not-found" sx={{ mt: 2 }}>
        <CardContent>
          <Typography gutterBottom variant="h5">Product not found</Typography>
          <Typography sx={{ mb: 2 }}>No catalog item exists for id "{itemId}".</Typography>
          <Button data-cy="product-form-cancel" onClick={onCancel} startIcon={<ArrowBackIcon />} type="button">
            Return to catalog
          </Button>
        </CardContent>
      </Card>
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
    <Card data-cy="product-form-page" sx={{ mt: 2 }}>
      <CardContent>
        <Typography data-cy="product-form-title" gutterBottom variant="h5">
          {isEditMode ? "Edit product" : "New product"}
        </Typography>
        <Stack component="form" data-cy="product-form" onSubmit={handleSubmit} spacing={2}>
          <TextField
          id="productHeader"
          name="productHeader"
          inputProps={{ "data-cy": "product-form-header" }}
          label="Header"
          value={header}
          onChange={(event) => setHeader(event.target.value)}
        />
          <TextField
          id="productDescription"
          name="productDescription"
          inputProps={{ "data-cy": "product-form-description" }}
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
          <TextField
          id="productPrice"
          name="productPrice"
          inputProps={{ "data-cy": "product-form-price" }}
          label="Price (cents)"
          value={price}
          onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))}
        />
          <Stack direction="row" spacing={1}>
            <Button data-cy="product-form-submit" disabled={isSubmitting} startIcon={<SaveIcon />} type="submit">
            {isSubmitting ? "Saving..." : "Save product"}
            </Button>
            <Button data-cy="product-form-cancel" onClick={onCancel} startIcon={<ArrowBackIcon />} type="button" variant="outlined">
              Cancel
            </Button>
          </Stack>
        </Stack>
        {errorMessage ? <Alert data-cy="product-form-error" severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert> : null}
      </CardContent>
    </Card>
  );
}
