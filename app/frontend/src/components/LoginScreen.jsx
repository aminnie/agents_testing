import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LoginIcon from "@mui/icons-material/Login";
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

export default function LoginScreen({
  email,
  password,
  authError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoHelp,
  onGoRegister
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
            <Button data-cy="login-help" onClick={onGoHelp} startIcon={<HelpOutlineIcon />} type="button">
              Help
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Typography data-cy="login-title" sx={{ mb: 2 }} variant="h4">Login</Typography>
      <Card data-cy="login-form">
        <CardContent>
          <Stack autoComplete="on" component="form" onSubmit={onSubmit} spacing={2}>
            <TextField
              autoComplete="username"
              id="email"
              inputProps={{ "data-cy": "login-email" }}
              label="Email"
              name="email"
              onChange={onEmailChange}
              type="email"
              value={email}
            />
            <TextField
              autoComplete="current-password"
              id="password"
              inputProps={{ "data-cy": "login-password" }}
              label="Password"
              name="password"
              onChange={onPasswordChange}
              type="password"
              value={password}
            />
            <Button data-cy="login-submit" startIcon={<LoginIcon />} type="submit">
              Sign in
            </Button>
            <Button
              data-cy="login-register-link"
              onClick={onGoRegister}
              sx={{ alignSelf: "flex-start", textTransform: "none" }}
              type="button"
              variant="text"
            >
              Not a registered user, please click here
            </Button>
            {authError ? <Alert data-cy="login-error" severity="error">{authError}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
