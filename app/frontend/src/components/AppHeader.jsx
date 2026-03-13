import { useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  AppBar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography
} from "@mui/material";

export default function AppHeader({
  userEmail,
  onGoStore,
  onGoCheckout,
  onGoHelp,
  onGoUserAdmin,
  onGoNewProduct,
  onLogout,
  isCheckoutEnabled,
  cartItemCount,
  isProductManagementEnabled,
  isAdmin
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isMenuOpen = Boolean(menuAnchor);

  function openMenu(event) {
    setMenuAnchor(event.currentTarget);
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <AppBar position="static" sx={{ borderRadius: 3, mt: 2 }}>
      <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
        <Button
          data-cy="nav-brand-store"
          onClick={onGoStore}
          startIcon={<StorefrontIcon />}
          sx={{ color: "inherit", minWidth: "auto", mr: 1, px: 1, textTransform: "none" }}
          type="button"
        >
          <Typography component="span" data-cy="dashboard-title" sx={{ fontWeight: 700 }} variant="h6">
            Happy Vibes
          </Typography>
        </Button>
        <Typography
          data-cy="session-user-email"
          sx={{ color: "#ffffff", fontWeight: 500, mr: "auto" }}
          variant="body2"
        >
          {userEmail || "unknown user"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <IconButton
            aria-label={`Shopping cart with ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}`}
            color="inherit"
            data-cy="nav-cart-icon"
            onClick={onGoCheckout}
            type="button"
          >
            <Badge
              badgeContent={cartItemCount}
              color="secondary"
              data-cy="nav-cart-count"
              max={999}
              showZero
            >
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          <Button data-cy="nav-store" onClick={onGoStore} startIcon={<StorefrontIcon />} type="button">
            Store
          </Button>
          <Button
            data-cy="nav-checkout"
            disabled={!isCheckoutEnabled}
            onClick={onGoCheckout}
            startIcon={<ShoppingCartCheckoutIcon />}
            type="button"
          >
            Checkout
          </Button>
          {isProductManagementEnabled ? (
            <Button
              data-cy="nav-new-product"
              onClick={onGoNewProduct}
              startIcon={<AddCircleOutlineIcon />}
              type="button"
            >
              New product
            </Button>
          ) : null}
          {isAdmin ? (
            <Button
              data-cy="nav-user-admin"
              onClick={onGoUserAdmin}
              startIcon={<AdminPanelSettingsIcon />}
              type="button"
            >
              User admin
            </Button>
          ) : null}
          <Button data-cy="nav-help" onClick={onGoHelp} startIcon={<HelpOutlineIcon />} type="button">
            Help
          </Button>
        </Box>
        <IconButton
          aria-controls={isMenuOpen ? "account-menu" : undefined}
          aria-expanded={isMenuOpen ? "true" : undefined}
          aria-haspopup="true"
          aria-label="Account menu"
          color="inherit"
          data-cy="account-menu-trigger"
          onClick={openMenu}
        >
          <AccountCircleIcon />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          id="account-menu"
          onClose={closeMenu}
          open={isMenuOpen}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
        >
          <MenuItem disabled>{userEmail || "unknown user"}</MenuItem>
          <MenuItem
            data-cy="logout-button"
            onClick={() => {
              closeMenu();
              onLogout();
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
