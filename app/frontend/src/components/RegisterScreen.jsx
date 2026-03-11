import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";

export default function RegisterScreen({
  displayName,
  email,
  password,
  registerError,
  isSubmitting,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onBackToLogin
}) {
  return (
    <Box className="container">
      <AppBar position="static" sx={{ borderRadius: 3, mt: 2, mb: 2 }}>
        <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
          <Typography
            component="h1"
            data-cy="unauth-store-title"
            sx={{ display: "flex", alignItems: "center", fontWeight: 700, mr: 1 }}
            variant="h6"
          >
            <StorefrontIcon sx={{ mr: 1 }} />
            Happy Vibes
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Button
              data-cy="register-login-link"
              onClick={onBackToLogin}
              startIcon={<ArrowBackIcon />}
              type="button"
            >
              Back to login
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Typography data-cy="register-title" sx={{ mb: 2 }} variant="h4">Create account</Typography>
      <Card data-cy="register-form">
        <CardContent>
          <Stack autoComplete="off" component="form" onSubmit={onSubmit} spacing={2}>
            <TextField
              autoComplete="name"
              id="displayName"
              inputProps={{ "data-cy": "register-display-name" }}
              label="Display name"
              name="displayName"
              onChange={onDisplayNameChange}
              value={displayName}
            />
            <TextField
              autoComplete="off"
              id="registerEmail"
              inputProps={{ "data-cy": "register-email" }}
              label="Email"
              name="registerEmail"
              onChange={onEmailChange}
              type="email"
              value={email}
            />
            <TextField
              autoComplete="new-password"
              id="registerPassword"
              inputProps={{ "data-cy": "register-password" }}
              label="Password"
              name="registerPassword"
              onChange={onPasswordChange}
              type="password"
              value={password}
            />
            <Button
              data-cy="register-submit"
              disabled={isSubmitting}
              startIcon={<AppRegistrationIcon />}
              type="submit"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            {registerError ? <Alert data-cy="register-error" severity="error">{registerError}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
